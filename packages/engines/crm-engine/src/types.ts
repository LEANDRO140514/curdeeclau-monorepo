// ── CRM Engine Types ──────────────────────────────────────
//
// Provider-agnostic CRM runtime types.
// All entity shapes come from @curdeeclau/shared.
// This file defines engine-specific types: config, errors, inputs.

import type { DomainEvent, RuntimeEventType, CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign, PipelineStage, ConversationOwner } from '@curdeeclau/shared';

// ── Re-exports ────────────────────────────────────────────

export type { DomainEvent, CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign, PipelineStage, ConversationOwner };

// ── CRM Event Types ───────────────────────────────────────

export type CRMEventType = Extract<RuntimeEventType,
  | 'ContactCreated'
  | 'ContactUpdated'
  | 'OpportunityCreated'
  | 'OpportunityMoved'
  | 'TagAdded'
  | 'TagRemoved'
  | 'PipelineCreated'
  | 'CampaignCreated'
  | 'CampaignPaused'
  | 'CampaignResumed'
>;

// ── Error Codes ───────────────────────────────────────────

export type CRMErrorCode =
  | 'CONTACT_NOT_FOUND'
  | 'OPPORTUNITY_NOT_FOUND'
  | 'PIPELINE_NOT_FOUND'
  | 'CAMPAIGN_NOT_FOUND'
  | 'TAG_NOT_FOUND'
  | 'INVALID_STAGE'
  | 'INVALID_STAGE_TRANSITION'
  | 'INVALID_STAGES'
  | 'INVALID_DATE_RANGE'
  | 'OPPORTUNITY_TERMINAL'
  | 'CAMPAIGN_ALREADY_PAUSED'
  | 'CAMPAIGN_NOT_PAUSED'
  | 'CAMPAIGN_ARCHIVED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_DRAFT'
  | 'OWNERSHIP_LOCKED'
  | 'OWNERSHIP_INSUFFICIENT'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_UNAVAILABLE';

// ── Structured Results ────────────────────────────────────

export interface CRMError {
  error: CRMErrorCode;
  message: string;
}

export function isCRMError(result: unknown): result is CRMError {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return typeof r.error === 'string' && typeof r.message === 'string';
}

// ── CRM Provider Interface ────────────────────────────────

export interface CreateContactInput {
  name: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  source?: string;
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface UpdateContactInput {
  contactId: string;
  changes: Partial<{
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    metadata: Record<string, unknown>;
  }>;
}

export interface CreateOpportunityInput {
  contactId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency?: string;
  expectedCloseAt?: number;
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface MoveOpportunityInput {
  opportunityId: string;
  targetStageId: string;
}

export interface CreatePipelineInput {
  name: string;
  stages: PipelineStage[];
  active?: boolean;
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface CreateCampaignInput {
  name: string;
  startAt?: number;
  endAt?: number;
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface AddTagInput {
  contactId: string;
  tag: string;
}

export interface RemoveTagInput {
  contactId: string;
  tag: string;
}

export interface CRMProvider {
  readonly providerName: string;

  // Contacts
  createContact(data: CreateContactInput): Promise<CRMContact>;
  updateContact(id: string, changes: Partial<CRMContact>): Promise<CRMContact>;
  getContact(id: string): Promise<CRMContact | undefined>;
  findContactByProviderId(provider: string, providerId: string): Promise<CRMContact | undefined>;

  // Opportunities
  createOpportunity(data: CreateOpportunityInput): Promise<CRMOpportunity>;
  moveOpportunity(id: string, stageId: string): Promise<CRMOpportunity>;
  getOpportunity(id: string): Promise<CRMOpportunity | undefined>;

  // Pipelines
  createPipeline(data: CreatePipelineInput): Promise<CRMPipeline>;
  getPipeline(id: string): Promise<CRMPipeline | undefined>;

  // Campaigns
  createCampaign(data: CreateCampaignInput): Promise<CRMCampaign>;
  pauseCampaign(id: string): Promise<CRMCampaign>;
  resumeCampaign(id: string): Promise<CRMCampaign>;
  getCampaign(id: string): Promise<CRMCampaign | undefined>;

  // Tags
  addTag(contactId: string, tag: string): Promise<CRMContact>;
  removeTag(contactId: string, tag: string): Promise<CRMContact>;
}

// ── CRM Engine Config ─────────────────────────────────────

export interface CRMEngineConfig {
  provider: CRMProvider;
  ownershipResolver?: (conversationId: string) => ConversationOwner;
}

// ── Engine Contract Context ───────────────────────────────

export interface CRMEngineContext {
  conversationId?: string;
  tenantId?: string;
  workflowId?: string;
  correlationId?: string;
  causationId?: string;
  actorId?: string;
  verticalId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
