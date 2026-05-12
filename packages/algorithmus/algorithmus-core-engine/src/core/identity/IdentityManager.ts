import pino, { type Logger } from "pino";
import { getRedis } from "../../infra/redis/client";
import { LeadsRepository } from "../../infra/postgres/LeadsRepository";

/** Fila `leads` alineada con `src/infra/postgres/schema.sql` y PRD §3.2. */
export type CoreLead = {
  id: string;
  tenant_id: string;
  phone_number: string;
  first_name: string | null;
  email: string | null;
  tags: Record<string, unknown>;
  fsm_state: string;
  ai_confidence_score: number;
  last_interaction: string | null;
  created_at: string;
  updated_at: string;
};

export class LeadLockContentionError extends Error {
  readonly code = "LEAD_LOCK_CONTENTION";
  constructor(message = "No se pudo adquirir lock de lead tras reintentos") {
    super(message);
    this.name = "LeadLockContentionError";
  }
}

const LOCK_TTL_SEC = 5;
const LOCK_MAX_ATTEMPTS = 3;
const LOCK_BACKOFF_MS = [50, 150, 350];

/** Libera el lock solo si el valor coincide con el token (compare-and-del atómico). */
const RELEASE_LOCK_LUA = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Backoff base con jitter (hasta ~30% adicional) para desincronizar reintentos. */
function backoffMsWithJitter(baseMs: number): number {
  const jitterCap = Math.floor(baseMs * 0.3);
  const jitter = jitterCap > 0 ? Math.floor(Math.random() * (jitterCap + 1)) : 0;
  return baseMs + jitter;
}

function normalizeChannel(channel: string): string {
  const value = channel.trim().toLowerCase();
  if (!value) {
    throw new Error("channel requerido");
  }
  return value;
}

function normalizeExternalId(externalId: string): string {
  const value = externalId.trim();
  if (!value) {
    throw new Error("externalId requerido");
  }
  return value;
}

function lockKeyForResolve(
  tenantId: string,
  channel: string,
  externalId: string,
): string {
  return `lock:lead:resolve:${tenantId}:${channel}:${externalId}`;
}

export type ResolveLeadInput = {
  readonly tenantId: string;
  readonly channel: string;
  readonly externalId: string;
  readonly traceId: string;
  readonly metadata?: Record<string, unknown>;
};

export type IdentityManagerDeps = {
  leadsRepository?: LeadsRepository;
  /** Por defecto se usa `getRedis` del módulo infra. */
  getRedis?: typeof getRedis;
  logger?: Logger;
  baseLogger?: Logger;
};

/**
 * Resolución de identidad multitenant (ADR-007).
 *
 * Mapeo canónico:
 *   (tenant_id, channel, external_id) -> lead
 *
 * Sin lógica específica por canal. Solo resolución de identidad + locking Redis.
 */
export class IdentityManager {
  private readonly leadsRepository: LeadsRepository;
  private readonly connectRedis: typeof getRedis;
  private readonly baseLogger: Logger;

  constructor(deps: IdentityManagerDeps = {}) {
    this.leadsRepository = deps.leadsRepository ?? new LeadsRepository();
    this.connectRedis = deps.getRedis ?? getRedis;
    this.baseLogger =
      deps.logger ??
      deps.baseLogger ??
      pino({
        level: process.env.LOG_LEVEL ?? "info",
        name: "algorithmus-core",
      });
  }

  /**
   * Resuelve o crea lead por identidad externa.
   */
  async resolveLead(input: ResolveLeadInput): Promise<CoreLead> {
    const channel = normalizeChannel(input.channel);
    const externalId = normalizeExternalId(input.externalId);
    const tenantId = input.tenantId;
    const traceId = input.traceId;

    const log = this.baseLogger.child({
      trace_id: traceId,
      module: "IdentityManager",
      tenant_id: tenantId,
      channel,
    });

    const identity = await this.leadsRepository.findExternalIdentity({
      tenantId,
      channel,
      externalId,
    });
    if (identity) {
      const lead = await this.leadsRepository.findLeadById({
        tenantId,
        leadId: identity.lead_id,
      });
      if (lead) {
        log.info({ step: "identity_cache_hit", leadId: lead.id }, "lead existente");
        return lead;
      }
      log.warn(
        {
          step: "identity_orphan_detected",
          identityId: identity.id,
          leadId: identity.lead_id,
        },
        "identidad encontrada sin lead asociado; se intentará recomponer",
      );
    }

    const lockKey = lockKeyForResolve(tenantId, channel, externalId);
    const token = traceId;

    log.info({ step: "lock_acquire_start", lockKey }, "adquiriendo lock Redis");
    const redis = await this.connectRedis();
    const locked = await this.acquireLockWithRetry(lockKey, token, log, redis);
    if (!locked) {
      log.warn({ step: "lock_failed", lockKey }, "contención de lock");
      throw new LeadLockContentionError();
    }

    try {
      const afterLockIdentity = await this.leadsRepository.findExternalIdentity({
        tenantId,
        channel,
        externalId,
      });
      if (afterLockIdentity) {
        const lead = await this.leadsRepository.findLeadById({
          tenantId,
          leadId: afterLockIdentity.lead_id,
        });
        if (lead) {
          log.info({ step: "identity_found_under_lock", leadId: lead.id }, "lead existente");
          return lead;
        }
      }

      const lead = await this.leadsRepository.createLeadWithExternalIdentity({
        tenantId,
        channel,
        externalId,
        metadata: input.metadata,
      });

      log.info({ step: "identity_created", leadId: lead.id }, "lead creado con identidad externa");
      return lead;
    } finally {
      try {
        const released = await redis.eval(RELEASE_LOCK_LUA, {
          keys: [lockKey],
          arguments: [token],
        });

        log.info(
          { step: "lock_released", released: released === 1 },
          "resultado liberación lock",
        );
      } catch (e) {
        log.warn({ step: "lock_release_skip", err: String(e) }, "no se liberó lock");
      }
    }
  }

  /**
   * SET key NX EX — valor = trace_id para liberación segura opcional.
   */
  private async acquireLockWithRetry(
    key: string,
    value: string,
    log: Logger,
    redis: Awaited<ReturnType<IdentityManager["connectRedis"]>>,
  ): Promise<boolean> {
    for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt++) {
      const ok = await redis.set(key, value, {
        NX: true,
        EX: LOCK_TTL_SEC,
      });
      if (ok === "OK") {
        log.info(
          { step: "lock_acquired", attempt: attempt + 1, key },
          "lock Redis OK",
        );
        return true;
      }
      log.info(
        { step: "lock_busy", attempt: attempt + 1, key },
        "lock ocupado; backoff",
      );
      if (attempt < LOCK_MAX_ATTEMPTS - 1) {
        await sleep(backoffMsWithJitter(LOCK_BACKOFF_MS[attempt] ?? 200));
      }
    }
    return false;
  }
}
