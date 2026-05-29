// ── Ownership Guard ──────────────────────────────────────
//
// Enforces ownership-based permission gating for all CRM operations.
// Invariants:
//   I17: LOCKED ownership blocks ALL CRM write operations.
//   I18: SHARED requires human approval for pipeline/opportunity mutations.
//   I19: Tag operations under AI are allowed; pipeline mutations are blocked.
//
// Ownership is read from a local-authoritative Map (#37).
// The Map is populated via handleOwnershipChanged() on the engine.
// Only handoff-engine mutates ownership at source.

import type { ConversationOwner } from '@curdeeclau/shared';
import type { CRMError } from '../types';

// ── Gated Actions ─────────────────────────────────────────

const PIPELINE_ACTIONS = new Set([
  'create_opportunity',
  'move_opportunity',
  'create_pipeline',
  'pause_campaign',
  'resume_campaign',
  'create_campaign',
]);

const TAG_ACTIONS = new Set(['add_tag', 'remove_tag']);

const CONTACT_ACTIONS = new Set(['create_contact', 'update_contact']);

// ── Permission Check ──────────────────────────────────────

export class OwnershipGuard {
  private ownershipView: Map<string, ConversationOwner>;

  constructor(ownershipView: Map<string, ConversationOwner>) {
    this.ownershipView = ownershipView;
  }

  /** Returns the effective owner for a conversation. Defaults to 'AI' per constitutional default. */
  getOwner(conversationId: string): ConversationOwner {
    return this.ownershipView.get(conversationId) ?? 'AI';
  }

  /**
   * Checks if the given action is allowed under the current ownership.
   * Returns null if allowed, or a structured CRMError if blocked.
   */
  check(action: string, conversationId?: string): CRMError | null {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';

    // I17: LOCKED blocks all
    if (owner === 'LOCKED') {
      return {
        error: 'OWNERSHIP_LOCKED',
        message: 'CRM writes blocked — ownership is LOCKED',
      };
    }

    // I18: AI cannot perform pipeline/opportunity mutations
    if (owner === 'AI' && PIPELINE_ACTIONS.has(action)) {
      return {
        error: 'OWNERSHIP_INSUFFICIENT',
        message: `Action "${action}" requires HUMAN or SHARED ownership, current owner is AI`,
      };
    }

    // SHARED allows tagging but not pipeline mutations
    if (owner === 'SHARED' && PIPELINE_ACTIONS.has(action)) {
      return {
        error: 'OWNERSHIP_INSUFFICIENT',
        message: `Action "${action}" requires HUMAN approval under SHARED ownership`,
      };
    }

    // HUMAN and AI can always do contacts and tags
    return null;
  }

  /** Returns whether the owner can perform pipeline/opportunity mutations. */
  canMutatePipeline(conversationId?: string): boolean {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';
    return owner === 'HUMAN';
  }

  /** Returns whether the owner can perform tag operations. */
  canTag(conversationId?: string): boolean {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';
    return owner !== 'LOCKED';
  }

  /** Returns whether the owner can perform contact operations. */
  canMutateContact(conversationId?: string): boolean {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';
    return owner !== 'LOCKED';
  }
}
