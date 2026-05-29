import type { DomainEvent, LifecycleState } from '@curdeeclau/shared';
import {
  createDomainEvent,
  validateOwnershipTransition,
} from '@curdeeclau/shared';
import type {
  HandoffEngineConfig,
  HandoffEngineInterface,
  HandoffPolicySet,
  HandoffEvalContext,
  HandoffResult,
  HandoffRequest,
  HandoffState,
  ConversationOwner,
  SuppressionMode,
  HandoffTrigger,
  OwnershipChangeCause,
} from '../types';
import { HandoffPolicyEvaluator } from '../policies/HandoffPolicyEvaluator';
import { OwnershipManager } from '../ownership/OwnershipManager';
import { SuppressionManager } from '../suppression/SuppressionManager';
import { RecoveryManager } from '../recovery/RecoveryManager';
import {
  handoffRequested,
  handoffAccepted,
  handoffRejected,
  ownershipChanged,
  suppressionActivated,
  aiRecoveryStarted,
  aiRecovered,
  handoffClosed,
} from '../events/HandoffEvents';

export class HandoffEngine implements HandoffEngineInterface {
  readonly engineName = 'handoff-engine';

  private config: HandoffEngineConfig;
  private policyEvaluator: HandoffPolicyEvaluator;
  private ownershipManager: OwnershipManager;
  private suppressionManager: SuppressionManager;
  private recoveryManager: RecoveryManager;
  private requests = new Map<string, HandoffRequest>();

  // ── RT-4 Lifecycle State (#34: constructor is allocation-only) ──

  private _lifecycleState: LifecycleState = 'UNINITIALIZED';

  get lifecycleState(): LifecycleState {
    return this._lifecycleState;
  }

  // ── RT-4 Ownership Authority (#35: conversational authority participant) ──

  private ownershipView: Map<string, ConversationOwner> = new Map();
  private sequenceMap: Map<string, number> = new Map();

  constructor(config: HandoffEngineConfig) {
    this.config = config;
    this.policyEvaluator = new HandoffPolicyEvaluator();
    this.ownershipManager = new OwnershipManager();
    this.suppressionManager = new SuppressionManager(this.ownershipManager);
    this.recoveryManager = new RecoveryManager(this.ownershipManager, this.suppressionManager);

    if (config.policies) {
      this.policyEvaluator.loadPolicies(config.policies);
    }
  }

  // ── RT-4 Lifecycle ───────────────────────────────────────

  async start(): Promise<void> {
    if (this._lifecycleState !== 'UNINITIALIZED') return;
    this._lifecycleState = 'READY';
  }

  async stop(): Promise<void> {
    if (this._lifecycleState === 'STOPPED') return;
    this._lifecycleState = 'STOPPED';
  }

  // ── Engine Contract (workflow-orchestrator compatible) ──

  async execute(
    action: string,
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // ── RT-4 Readiness gate (#36: lifecycle reflects real operational behavior) ──
    if (this._lifecycleState !== 'READY') {
      return { error: 'engine_not_ready', message: `Engine is ${this._lifecycleState}. Call start() before execute().` };
    }

    const conversationId = context.conversationId as string;

    switch (action) {
      // ── RT-4: Canonical ownership authority ──────────────

      case 'set_ownership': {
        const owner = context.owner as ConversationOwner | undefined;
        const cause = (context.cause as OwnershipChangeCause) ?? 'system_init';
        const initiatedBy = context.initiatedBy as string | undefined;
        const reason = context.reason as string | undefined;
        const workflowId = context.workflowId as string | undefined;

        if (!conversationId || !owner) {
          return { error: 'VALIDATION_ERROR', message: 'set_ownership requires conversationId and owner' };
        }

        const previousOwner: ConversationOwner = this.ownershipView.get(conversationId) ?? 'AI';
        if (!validateOwnershipTransition(previousOwner, owner)) {
          return { error: 'OWNERSHIP_LOCKED', message: `Transition ${previousOwner} → ${owner} is not allowed` };
        }

        const sequence = (this.sequenceMap.get(conversationId) ?? 0) + 1;

        this.ownershipView.set(conversationId, owner);
        this.sequenceMap.set(conversationId, sequence);

        const event = createDomainEvent('OwnershipChanged', {
          conversationId,
          workflowId,
          actorId: initiatedBy ?? 'handoff-engine',
          payload: {
            conversationId,
            owner,
            previousOwner,
            sequence,
            cause,
            changedAt: Date.now(),
            initiatedBy: initiatedBy ?? 'handoff-engine',
            workflowId,
            reason,
          },
        });

        this.emitAll([event]);

        return {
          conversationId,
          owner,
          previousOwner,
          sequence,
          cause,
        };
      }

      case 'get_ownership': {
        if (!conversationId) {
          return { error: 'VALIDATION_ERROR', message: 'get_ownership requires conversationId' };
        }
        const owner = this.ownershipView.get(conversationId) ?? 'AI';
        const sequence = this.sequenceMap.get(conversationId) ?? 0;
        return { conversationId, owner, sequence };
      }

      // ── Existing handoff workflow (unchanged) ────────────

      case 'evaluate': {
        const evalCtx: HandoffEvalContext = {
          conversationId,
          trigger: (context.trigger as HandoffTrigger) ?? 'HUMAN_REQUEST',
          escalationLevel: (context.escalationLevel as HandoffEvalContext['escalationLevel']) ?? 'medium',
          keywords: context.keywords as string[] | undefined,
          intent: context.intent as string | undefined,
          sentiment: context.sentiment as HandoffEvalContext['sentiment'],
          timeOfDay: context.timeOfDay as string | undefined,
          conversationDurationMs: context.conversationDurationMs as number | undefined,
          metadata: context.metadata as Record<string, unknown> | undefined,
        };
        const result = await this.evaluate(evalCtx);
        return result as unknown as Record<string, unknown>;
      }

      case 'accept':
        return (await this.accept(conversationId)) as unknown as Record<string, unknown>;

      case 'reject':
        return (await this.reject(conversationId)) as unknown as Record<string, unknown>;

      case 'recover':
        return (await this.recover(conversationId)) as unknown as Record<string, unknown>;

      case 'close':
        return (await this.close(conversationId)) as unknown as Record<string, unknown>;

      default:
        return { error: 'VALIDATION_ERROR', message: `Unknown handoff action: ${action}` };
    }
  }

  // ── Core Operations ──────────────────────────────────

  async evaluate(context: HandoffEvalContext): Promise<HandoffResult> {
    const convState = this.ownershipManager.getOrCreate(context.conversationId);

    if (convState.owner === 'LOCKED') {
      return this.rejectedResult(context, 'LOCKED ownership prevents handoff', convState.handoffState);
    }

    const matchedRules = this.policyEvaluator.evaluate(context);
    if (matchedRules.length === 0) {
      return this.rejectedResult(context, 'No matching policy rule', convState.handoffState);
    }

    const rule = matchedRules[0];

    if (!this.checkCooldown(context.conversationId, rule.id, rule.cooldownMs ?? 0)) {
      return this.rejectedResult(
        context,
        `Rule "${rule.id}" on cooldown`,
        convState.handoffState,
      );
    }

    const request = this.createRequest(context, rule);
    this.requests.set(request.id, request);

    const previousOwner = convState.owner;
    convState.handoffState = 'HANDOFF_PENDING';
    convState.activeRequest = request;

    const suppressionMode = this.resolveSuppression(context.escalationLevel);
    this.suppressionManager.activate(context.conversationId, suppressionMode);

    const events: DomainEvent[] = [
      handoffRequested(
        context.conversationId,
        context.trigger,
        rule.id,
        context.trigger,
        rule.target.id,
      ),
    ];

    if (previousOwner !== 'AI') {
      const transfer = this.ownershipManager.transferOwnership(context.conversationId, 'AI');
      if (transfer.success) {
        events.push(ownershipChanged(context.conversationId, previousOwner, 'AI'));
      }
    }

    events.push(suppressionActivated(context.conversationId, suppressionMode, 'NONE'));

    this.emitAll(events);

    return {
      request,
      accepted: true,
      previousOwner,
      newOwner: convState.owner,
      suppressionMode,
      state: convState.handoffState,
      events,
    };
  }

  async accept(conversationId: string): Promise<HandoffResult> {
    const convState = this.ownershipManager.getState(conversationId);
    if (!convState) {
      return this.rejectedResult({ conversationId, trigger: 'HUMAN_REQUEST', escalationLevel: 'medium' }, 'No handoff state found');
    }

    const previousOwner = convState.owner;
    const transfer = this.ownershipManager.transferOwnership(conversationId, 'HUMAN');
    if (!transfer.success) {
      return this.rejectedResult({ conversationId, trigger: 'HUMAN_REQUEST', escalationLevel: 'medium' }, transfer.error ?? 'Transfer failed', convState.handoffState);
    }

    convState.handoffState = 'HUMAN_ACTIVE';

    if (convState.activeRequest) {
      convState.activeRequest.status = 'accepted';
    }

    const suppressionMode = convState.suppressionMode;
    const events: DomainEvent[] = [
      handoffAccepted(conversationId, previousOwner, 'HUMAN'),
      ownershipChanged(conversationId, previousOwner, 'HUMAN'),
    ];
    this.emitAll(events);

    return {
      request: convState.activeRequest ?? this.emptyRequest(conversationId),
      accepted: true,
      previousOwner,
      newOwner: 'HUMAN',
      suppressionMode,
      state: 'HUMAN_ACTIVE',
      events,
    };
  }

  async reject(conversationId: string): Promise<HandoffResult> {
    const convState = this.ownershipManager.getState(conversationId);
    if (!convState) {
      return this.rejectedResult({ conversationId, trigger: 'HUMAN_REQUEST', escalationLevel: 'medium' }, 'No handoff state found');
    }

    const previousOwner = convState.owner;
    this.ownershipManager.transferOwnership(conversationId, 'AI');
    this.suppressionManager.deactivate(conversationId);

    convState.handoffState = 'AI_ACTIVE';

    if (convState.activeRequest) {
      convState.activeRequest.status = 'rejected';
    }

    const events: DomainEvent[] = [
      handoffRejected(conversationId, 'Handoff rejected'),
      ownershipChanged(conversationId, previousOwner, 'AI'),
    ];
    this.emitAll(events);

    return {
      request: convState.activeRequest ?? this.emptyRequest(conversationId),
      accepted: false,
      previousOwner,
      newOwner: 'AI',
      suppressionMode: 'NONE',
      state: 'AI_ACTIVE',
      events,
    };
  }

  async recover(conversationId: string): Promise<HandoffResult> {
    const convState = this.ownershipManager.getOrCreate(conversationId);
    const previousOwner = convState.owner;

    const recoveryResult = this.recoveryManager.requestRecovery(conversationId);
    if (!recoveryResult.success) {
      return this.rejectedResult(
        { conversationId, trigger: 'HUMAN_REQUEST', escalationLevel: 'medium' },
        recoveryResult.error ?? 'Recovery failed',
        convState.handoffState,
      );
    }

    const events: DomainEvent[] = [
      aiRecoveryStarted(conversationId, previousOwner),
    ];

    const completeResult = this.recoveryManager.completeRecovery(conversationId);
    if (completeResult.success) {
      events.push(aiRecovered(conversationId, previousOwner));
    }

    this.emitAll(events);

    return {
      request: convState.activeRequest ?? this.emptyRequest(conversationId),
      accepted: completeResult.success,
      previousOwner,
      newOwner: completeResult.newOwner,
      suppressionMode: completeResult.suppressionMode,
      state: completeResult.newState,
      events,
    };
  }

  async close(conversationId: string): Promise<HandoffResult> {
    const convState = this.ownershipManager.getOrCreate(conversationId);
    const previousOwner = convState.owner;
    const previousState = convState.handoffState;

    convState.handoffState = 'HANDOFF_CLOSED';
    this.recoveryManager.clearScheduledRecovery(conversationId);

    const events: DomainEvent[] = [
      handoffClosed(conversationId, previousState),
    ];
    this.emitAll(events);

    return {
      request: convState.activeRequest ?? this.emptyRequest(conversationId),
      accepted: true,
      previousOwner,
      newOwner: previousOwner,
      suppressionMode: convState.suppressionMode,
      state: 'HANDOFF_CLOSED',
      events,
    };
  }

  // ── Query ────────────────────────────────────────────

  getState(conversationId: string) {
    return this.ownershipManager.getState(conversationId);
  }

  loadPolicies(policies: HandoffPolicySet): void {
    this.config.policies = policies;
    this.policyEvaluator.loadPolicies(policies);
  }

  getPolicyEvaluator(): HandoffPolicyEvaluator {
    return this.policyEvaluator;
  }

  getOwnershipManager(): OwnershipManager {
    return this.ownershipManager;
  }

  getSuppressionManager(): SuppressionManager {
    return this.suppressionManager;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  destroy(): void {
    this.recoveryManager.destroy();
    this.requests.clear();
  }

  // ── Internal Helpers ─────────────────────────────────

  private resolveSuppression(level: HandoffEvalContext['escalationLevel']): SuppressionMode {
    switch (level) {
      case 'critical':
      case 'legal':
        return 'FULL_SUPPRESSION';
      case 'high':
        return 'ASSIST_MODE';
      case 'medium':
        return 'SILENT_OBSERVER';
      case 'low':
      default:
        return 'NONE';
    }
  }

  private checkCooldown(conversationId: string, ruleId: string, cooldownMs: number): boolean {
    if (cooldownMs <= 0) return true;

    const state = this.ownershipManager.getState(conversationId);
    if (!state) return true;

    const lastUsed = state.cooldowns.get(ruleId);
    if (lastUsed === undefined) {
      state.cooldowns.set(ruleId, Date.now());
      return true;
    }

    if (Date.now() - lastUsed < cooldownMs) {
      return false;
    }

    state.cooldowns.set(ruleId, Date.now());
    return true;
  }

  private createRequest(
    context: HandoffEvalContext,
    rule: import('../types').HandoffRule,
  ): HandoffRequest {
    const timeoutMs = this.config.policies?.defaultTimeoutMs ?? this.config.defaultTimeoutMs;
    const now = Date.now();
    return {
      id: `hreq-${context.conversationId}-${now}`,
      conversationId: context.conversationId,
      trigger: context.trigger,
      matchedRuleId: rule.id,
      escalationLevel: context.escalationLevel,
      reason: `Trigger: ${context.trigger}`,
      summary: rule.name,
      context: context.metadata ?? {},
      target: rule.target,
      requestedAt: now,
      expiresAt: now + timeoutMs,
      status: 'pending',
    };
  }

  private emptyRequest(conversationId: string): HandoffRequest {
    return {
      id: `hreq-empty-${conversationId}`,
      conversationId,
      trigger: 'HUMAN_REQUEST',
      matchedRuleId: '',
      escalationLevel: 'low',
      reason: '',
      summary: '',
      context: {},
      target: { type: 'human', id: '', name: '' },
      requestedAt: Date.now(),
      status: 'pending',
    };
  }

  private rejectedResult(
    context: Pick<HandoffEvalContext, 'conversationId' | 'trigger' | 'escalationLevel'>,
    reason: string,
    state: HandoffState = 'AI_ACTIVE',
  ): HandoffResult {
    const convState = this.ownershipManager.getState(context.conversationId);
    return {
      request: {
        id: `hreq-rejected-${context.conversationId}-${Date.now()}`,
        conversationId: context.conversationId,
        trigger: context.trigger,
        matchedRuleId: '',
        escalationLevel: context.escalationLevel,
        reason,
        summary: '',
        context: {},
        target: { type: 'human', id: '', name: '' },
        requestedAt: Date.now(),
        status: 'rejected',
      },
      accepted: false,
      previousOwner: convState?.owner ?? 'AI',
      newOwner: convState?.owner ?? 'AI',
      suppressionMode: convState?.suppressionMode ?? 'NONE',
      state,
      events: [],
    };
  }

  private emitAll(events: DomainEvent[]): void {
    if (!this.config.emitFn) return;
    for (const event of events) {
      this.config.emitFn(event);
    }
  }
}
