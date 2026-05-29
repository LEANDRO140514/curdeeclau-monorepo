// ── Canonical Contracts ─────────────────────────────────
import type { DomainEvent, RuntimeEventType } from '@curdeeclau/shared';
export type { DomainEvent } from '@curdeeclau/shared';

// ── Ownership ──────────────────────────────────────────

import type { ConversationOwner, OwnershipChangeCause } from '@curdeeclau/shared';
export type { ConversationOwner, OwnershipChangeCause };

// ── Suppression ────────────────────────────────────────

import type { SuppressionMode } from '@curdeeclau/shared';
export type { SuppressionMode };

// ── Handoff Lifecycle States ───────────────────────────

export type HandoffState =
  | 'AI_ACTIVE'
  | 'HANDOFF_PENDING'
  | 'HUMAN_ACTIVE'
  | 'AI_ASSISTED_HUMAN'
  | 'AI_RECOVERY_PENDING'
  | 'AI_RESTORED'
  | 'HANDOFF_CLOSED';

// ── Trigger Types ──────────────────────────────────────

export type HandoffTrigger =
  | 'HUMAN_REQUEST'
  | 'KNOWLEDGE_GAP'
  | 'AFTER_HOURS'
  | 'LOW_CONFIDENCE'
  | 'LEGAL_RISK'
  | 'EMERGENCY'
  | 'HIGH_SENTIMENT';

// ── Event Types (handoff domain) ───────────────────────

export type HandoffEventType = Extract<RuntimeEventType,
  | 'HandoffRequested'
  | 'HandoffAccepted'
  | 'HandoffRejected'
  | 'OwnershipChanged'
  | 'SuppressionActivated'
  | 'AIRecoveryStarted'
  | 'AIRecovered'
  | 'HandoffClosed'
>;

// ── Handoff Event Payload (narrowing helper, not an envelope) ─

export interface HandoffEventPayload {
  previousOwner?: ConversationOwner;
  newOwner?: ConversationOwner;
  suppressionMode?: SuppressionMode;
  previousSuppressionMode?: SuppressionMode;
  handoffState?: HandoffState;
  trigger?: HandoffTrigger;
  matchedRuleId?: string;
  reason?: string;
  targetId?: string;
  [key: string]: unknown;
}

// ── Policy Rules (declarative, loaded from vertical) ───

export interface HandoffCondition {
  field: 'keyword' | 'escalationLevel' | 'intent' | 'sentiment' | 'timeOfDay' | 'conversationDuration';
  operator: 'equals' | 'contains' | 'in' | 'gte' | 'lte' | 'regex';
  value: string | number | string[];
}

export interface HandoffTarget {
  type: 'human' | 'team' | 'department' | 'external';
  id: string;
  name: string;
  channels?: HandoffChannel[];
  availability?: AvailabilityWindow;
}

export interface HandoffChannel {
  channel: 'whatsapp' | 'web' | 'phone' | 'email';
  address: string;
  priority: number;
}

export interface AvailabilityWindow {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface HandoffRule {
  id: string;
  name: string;
  priority: number;
  conditions: HandoffCondition[];
  target: HandoffTarget;
  cooldownMs?: number;
  enabled: boolean;
}

export interface HandoffPolicySet {
  vertical: string;
  description?: string;
  rules: HandoffRule[];
  targets: HandoffTarget[];
  defaultTimeoutMs: number;
  maxQueueSize: number;
}

// ── Handoff Request & Result ───────────────────────────

export interface HandoffRequest {
  id: string;
  conversationId: string;
  trigger: HandoffTrigger;
  matchedRuleId: string;
  escalationLevel: 'low' | 'medium' | 'high' | 'critical' | 'legal';
  reason: string;
  summary: string;
  context: Record<string, unknown>;
  target: HandoffTarget;
  requestedAt: number;
  expiresAt?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'completed';
}

export interface HandoffResult {
  request: HandoffRequest;
  accepted: boolean;
  previousOwner: ConversationOwner;
  newOwner: ConversationOwner;
  suppressionMode: SuppressionMode;
  state: HandoffState;
  events: DomainEvent[];
}

// ── Engine Config ──────────────────────────────────────

export interface HandoffEngineConfig {
  defaultTimeoutMs: number;
  maxQueueSize: number;
  policies: HandoffPolicySet;
  emitFn?: (event: DomainEvent) => void;
}

export const DEFAULT_HANDOFF_CONFIG: Partial<HandoffEngineConfig> = {
  defaultTimeoutMs: 300_000,
  maxQueueSize: 10,
};

// ── Per-Conversation State ─────────────────────────────

export interface ConversationHandoffState {
  conversationId: string;
  owner: ConversationOwner;
  suppressionMode: SuppressionMode;
  handoffState: HandoffState;
  activeRequest?: HandoffRequest;
  lastOwnershipChange: number;
  recoveryEligibleAt?: number;
  cooldowns: Map<string, number>;
}

// ── Evaluation Context ─────────────────────────────────

export interface HandoffEvalContext {
  conversationId: string;
  trigger: HandoffTrigger;
  escalationLevel: 'low' | 'medium' | 'high' | 'critical' | 'legal';
  keywords?: string[];
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  timeOfDay?: string;
  conversationDurationMs?: number;
  metadata?: Record<string, unknown>;
}

// ── Engine Contract (compatible with workflow-orchestrator) ─

export interface HandoffEngineInterface {
  readonly engineName: string;
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
  evaluate(context: HandoffEvalContext): Promise<HandoffResult>;
  accept(conversationId: string): Promise<HandoffResult>;
  reject(conversationId: string): Promise<HandoffResult>;
  recover(conversationId: string): Promise<HandoffResult>;
  close(conversationId: string): Promise<HandoffResult>;
  getState(conversationId: string): ConversationHandoffState | undefined;
  loadPolicies(policies: HandoffPolicySet): void;
}
