// ── Provider Failure Taxonomy ──────────────────────────────
//
// Governed namespace of provider failure categories.
// Engine-specific error codes (CRMErrorCode, CalendarErrorCode)
// remain engine-local — this taxonomy is provider-agnostic.
//
// The optional `code` field preserves domain error codes that
// flow through the provider boundary via structured throws.

export type ProviderFailureType =
  | 'PROVIDER_UNAVAILABLE'   // provider unreachable, down, or timed out
  | 'PROVIDER_REJECTED'      // provider rejected the request (validation, rate limit, auth)
  | 'PROVIDER_UNKNOWN';      // unexpected provider error (catch-all)

// ── Provider Error ─────────────────────────────────────────

export interface ProviderError {
  readonly failureType: ProviderFailureType;
  readonly providerName: string;
  readonly message: string;
  readonly code?: string;     // domain error code parsed from structured provider throw
  readonly cause?: unknown;
}

// ── Factory ────────────────────────────────────────────────

export function createProviderError(params: {
  failureType: ProviderFailureType;
  providerName: string;
  message: string;
  code?: string;
  cause?: unknown;
}): ProviderError {
  return {
    failureType: params.failureType,
    providerName: params.providerName,
    message: params.message,
    code: params.code,
    cause: params.cause,
  };
}

// ── Wrapper ────────────────────────────────────────────────

const UPPER_SNAKE_RE = /^[A-Z][A-Z_0-9]+$/;

function tryParseCode(raw: string): string | undefined {
  const colon = raw.indexOf(': ');
  if (colon === -1) return undefined;
  const candidate = raw.slice(0, colon);
  if (candidate.length > 64) return undefined;
  if (!UPPER_SNAKE_RE.test(candidate)) return undefined;
  return candidate;
}

const CODE_TO_FAILURE: Record<string, ProviderFailureType> = {
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
};

export function wrapProviderError(providerName: string, err: unknown): ProviderError {
  const message = err instanceof Error ? err.message : String(err);
  const code = tryParseCode(message);
  const cleanMessage = code ? message.slice(message.indexOf(': ') + 2) : message;
  const failureType = code ? (CODE_TO_FAILURE[code] ?? 'PROVIDER_UNKNOWN') : 'PROVIDER_UNKNOWN';
  return createProviderError({
    failureType,
    providerName,
    message: cleanMessage,
    code,
    cause: err,
  });
}
