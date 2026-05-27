// ── CRM Engine ───────────────────────────────────────────
//
// Provider-agnostic CRM Runtime Engine.
// Implements the Engine contract from workflow-orchestrator.
//
// Coordinates:
//   OwnershipGuard  — permission gating (I17, I18, I19)
//   CRMValidation   — input validation
//   Entity managers — business logic + event emission
//
// All results are structured: { entity } on success, { error, message } on failure.
// Events are emitted on every successful mutation (I20).

import type { CRMProvider, CRMError, CRMEngineConfig, CRMEngineContext, CreateContactInput, UpdateContactInput, CreateOpportunityInput, MoveOpportunityInput, CreatePipelineInput, CreateCampaignInput } from '../types';
import { wrapProviderError } from '@curdeeclau/shared';
import { OwnershipGuard } from '../runtime/OwnershipGuard';
import { CRMEventEmitter } from '../runtime/CRMEventEmitter';
import { CRMValidation } from '../runtime/CRMValidation';
import { ContactManager } from '../entities/ContactManager';
import { OpportunityManager } from '../entities/OpportunityManager';
import { PipelineManager } from '../entities/PipelineManager';
import { CampaignManager } from '../entities/CampaignManager';
import { TagManager } from '../entities/TagManager';

export class CRMEngine {
  readonly engineName = 'crm-engine';

  private provider: CRMProvider;
  private guard: OwnershipGuard;
  private events: CRMEventEmitter;
  private validation: CRMValidation;
  private contacts: ContactManager;
  private opportunities: OpportunityManager;
  private pipelines: PipelineManager;
  private campaigns: CampaignManager;
  private tags: TagManager;

  constructor(config: CRMEngineConfig) {
    this.provider = config.provider;
    this.guard = new OwnershipGuard(config.ownershipResolver);
    this.events = new CRMEventEmitter();
    this.validation = new CRMValidation();
    this.contacts = new ContactManager(this.provider, this.events);
    this.opportunities = new OpportunityManager(this.provider, this.events);
    this.pipelines = new PipelineManager(this.provider, this.events);
    this.campaigns = new CampaignManager(this.provider, this.events);
    this.tags = new TagManager(this.provider, this.events);
  }

  // ── Engine Contract ──────────────────────────────────────

  async execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const ctx = this.resolveContext(context);

    // ── Ownership check ──
    const ownershipError = this.guard.check(action, ctx.conversationId);
    if (ownershipError) return ownershipError as unknown as Record<string, unknown>;

    // ── Route action ──
    try {
      switch (action) {
      case 'create_contact': {
        const validationError = this.validation.validateCreateContact(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.contacts.create(context as unknown as CreateContactInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'update_contact': {
        const validationError = this.validation.validateUpdateContact(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.contacts.update(context as unknown as UpdateContactInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'create_opportunity': {
        const validationError = this.validation.validateCreateOpportunity(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.opportunities.create(context as unknown as CreateOpportunityInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'move_opportunity': {
        const validationError = this.validation.validateMoveOpportunity(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.opportunities.move(context as unknown as MoveOpportunityInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'add_tag': {
        const validationError = this.validation.validateAddTag(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        const input = context as unknown as { contactId: string; tag: string };
        return this.tags.add(input.contactId, input.tag, ctx) as unknown as Record<string, unknown>;
      }

      case 'remove_tag': {
        const validationError = this.validation.validateRemoveTag(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        const input = context as unknown as { contactId: string; tag: string };
        return this.tags.remove(input.contactId, input.tag, ctx) as unknown as Record<string, unknown>;
      }

      case 'create_pipeline': {
        const validationError = this.validation.validateCreatePipeline(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.pipelines.create(context as unknown as CreatePipelineInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'create_campaign': {
        const validationError = this.validation.validateCreateCampaign(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        return this.campaigns.create(context as unknown as CreateCampaignInput, ctx) as unknown as Record<string, unknown>;
      }

      case 'pause_campaign': {
        const validationError = this.validation.validateCampaignAction(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        const input = context as { campaignId: string };
        return this.campaigns.pause(input.campaignId, ctx) as unknown as Record<string, unknown>;
      }

      case 'resume_campaign': {
        const validationError = this.validation.validateCampaignAction(context);
        if (validationError) return validationError as unknown as Record<string, unknown>;
        const input = context as { campaignId: string };
        return this.campaigns.resume(input.campaignId, ctx) as unknown as Record<string, unknown>;
      }

      default:
        return { error: 'VALIDATION_ERROR', message: `Unknown action: "${action}"` } as unknown as Record<string, unknown>;
    }
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message } as unknown as Record<string, unknown>;
    }
  }

  // ── Context Resolution ───────────────────────────────────

  private resolveContext(context: Record<string, unknown>): CRMEngineContext {
    return {
      conversationId: typeof context.conversationId === 'string' ? context.conversationId : undefined,
      tenantId: typeof context.tenantId === 'string' ? context.tenantId : undefined,
      workflowId: typeof context.workflowId === 'string' ? context.workflowId : undefined,
      correlationId: typeof context.correlationId === 'string' ? context.correlationId : undefined,
      causationId: typeof context.causationId === 'string' ? context.causationId : undefined,
      actorId: typeof context.actorId === 'string' ? context.actorId : 'crm-engine',
      verticalId: typeof context.verticalId === 'string' ? context.verticalId : undefined,
      metadata: context.metadata as Record<string, unknown> | undefined,
    };
  }

  // ── Introspection (for tests and orchestration) ──────────

  getProvider(): CRMProvider {
    return this.provider;
  }

  getGuard(): OwnershipGuard {
    return this.guard;
  }

  getEvents(): CRMEventEmitter {
    return this.events;
  }

  getValidation(): CRMValidation {
    return this.validation;
  }

  getContactManager(): ContactManager {
    return this.contacts;
  }

  getOpportunityManager(): OpportunityManager {
    return this.opportunities;
  }

  getPipelineManager(): PipelineManager {
    return this.pipelines;
  }

  getCampaignManager(): CampaignManager {
    return this.campaigns;
  }

  getTagManager(): TagManager {
    return this.tags;
  }
}
