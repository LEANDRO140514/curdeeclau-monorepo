// ── Ownership Guard ──────────────────────────────────────
// Enforces ownership permission matrix per OpenSpec §11.
// I24: LOCKED blocks ALL writes
// I25: AI can only read + create reminders
// I26: SHARED requires approvedBy for mutations
// I27: HUMAN has full access
//
// RT-4: Ownership is read from a local-authoritative Map (#37).
// The Map is populated via handleOwnershipChanged() on the engine.
// Only handoff-engine mutates ownership at source.

import type { ConversationOwner } from '@curdeeclau/shared';
import type { CalendarError } from '../types';

const READ_ACTIONS = new Set(['check_availability']);

const REMINDER_ACTIONS = new Set(['create_reminder', 'cancel_reminder']);

const MUTATION_ACTIONS = new Set([
  'create_reservation',
  'cancel_reservation',
  'reschedule_reservation',
  'block_time_slot',
  'release_time_slot',
]);

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
   * Returns null if action is allowed, or a CalendarError if blocked.
   * Ownership is resolved from the local-authoritative view using conversationId.
   * approvedBy is required for mutations under SHARED ownership.
   */
  check(
    action: string,
    conversationId?: string,
    approvedBy?: string,
  ): CalendarError | null {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';

    // I24: LOCKED blocks everything except reads
    if (owner === 'LOCKED') {
      if (READ_ACTIONS.has(action)) return null;
      return {
        error: 'OWNERSHIP_LOCKED',
        message: `Action '${action}' blocked — ownership is LOCKED`,
      };
    }

    // I25: AI can read + manage reminders, but NOT mutate reservations/slots
    if (owner === 'AI') {
      if (READ_ACTIONS.has(action) || REMINDER_ACTIONS.has(action)) return null;
      return {
        error: 'OWNERSHIP_INSUFFICIENT',
        message: `Action '${action}' requires HUMAN or SHARED ownership, current: AI`,
      };
    }

    // I26: SHARED requires explicit human approval for mutations
    if (owner === 'SHARED' && MUTATION_ACTIONS.has(action)) {
      if (!approvedBy) {
        return {
          error: 'APPROVAL_REQUIRED',
          message: `Action '${action}' requires human approval under SHARED ownership`,
        };
      }
    }

    // I27: HUMAN has full access
    return null;
  }

  /**
   * Returns which actions the given conversation's owner can perform (for introspection/debugging).
   */
  getAllowedActions(conversationId?: string): {
    read: boolean;
    reminders: boolean;
    mutations: boolean;
  } {
    const owner = conversationId ? this.getOwner(conversationId) : 'AI';
    if (owner === 'LOCKED') return { read: true, reminders: false, mutations: false };
    if (owner === 'AI') return { read: true, reminders: true, mutations: false };
    return { read: true, reminders: true, mutations: true };
  }
}
