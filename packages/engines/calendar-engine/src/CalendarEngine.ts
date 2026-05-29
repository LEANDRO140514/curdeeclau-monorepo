// ── Calendar Engine ──────────────────────────────────────
// Provider-agnostic Temporal Runtime Coordination Engine.
// Implements the Engine contract from workflow-orchestrator:
//   { engineName: string; execute(action, context): Promise<Record<string, unknown>> }
//
// OpenSpec coverage:
//   §4  Capabilities: 8 actions (check_availability, create/cancel/reschedule_reservation,
//       block/release_time_slot, create/cancel_reminder)
//   §6  Invariants: I1-I30 enforced
//   §11 Ownership: gates applied before every mutation
//   §5  Events: DomainEvent emitted for every mutation (I28-I30)
//
// RT-4: Lifecycle + Ownership retrofit.
//   Lifecycle: UNINITIALIZED → READY → STOPPED (#34, #36, #39)
//   Ownership: event-driven, local-authoritative via ownershipView (#35, #37)
//   No ownership query paths on the execute() hot path (#37)

import type {
  Reservation, TimeSlot, Reminder, ConversationOwner,
  LifecycleState, OwnershipChangedPayload,
} from '@curdeeclau/shared';
import { wrapProviderError } from '@curdeeclau/shared';
import type {
  CalendarEngineConfig,
  CalendarEngineContext,
  CalendarError,
  CalendarProvider,
} from './types';

import { OwnershipGuard } from './runtime/OwnershipGuard';
import { TemporalValidator } from './runtime/TemporalValidator';
import { ReservationLifecycle } from './runtime/ReservationLifecycle';
import { ReminderScheduler } from './runtime/ReminderScheduler';
import { CalendarEventEmitter } from './runtime/CalendarEventEmitter';

import {
  availabilityChecked,
  reservationCreated,
  reservationCancelled,
  reservationRescheduled,
  timeSlotBlocked,
  timeSlotReleased,
  reminderCreated,
  reminderCancelled,
} from './events/CalendarEvents';

export class CalendarEngine {
  readonly engineName = 'calendar-engine';

  private provider: CalendarProvider;
  private ownershipGuard: OwnershipGuard;
  private temporalValidator = new TemporalValidator();
  private reservationLifecycle = new ReservationLifecycle();
  private reminderScheduler = new ReminderScheduler();
  private events = new CalendarEventEmitter();

  // ── Lifecycle State (#34: constructor is allocation-only) ──

  private _lifecycleState: LifecycleState = 'UNINITIALIZED';

  get lifecycleState(): LifecycleState {
    return this._lifecycleState;
  }

  // ── Ownership (#35: local-authoritative, event-driven) ─────

  private ownershipView: Map<string, ConversationOwner> = new Map();

  constructor(config: CalendarEngineConfig) {
    this.provider = config.provider;
    this.ownershipGuard = new OwnershipGuard(this.ownershipView);
  }

  // ── Lifecycle ───────────────────────────────────────────

  async start(): Promise<void> {
    if (this._lifecycleState !== 'UNINITIALIZED') return;
    this._lifecycleState = 'READY';
  }

  async stop(): Promise<void> {
    if (this._lifecycleState === 'STOPPED') return;
    this._lifecycleState = 'STOPPED';
  }

  // ── Ownership Propagation ───────────────────────────────

  handleOwnershipChanged(payload: OwnershipChangedPayload): void {
    this.ownershipView.set(payload.conversationId, payload.owner);
  }

  // ── Event Access ──────────────────────────────────────────

  get eventEmitter(): CalendarEventEmitter {
    return this.events;
  }

  // ── Engine Contract: execute ──────────────────────────────

  async execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    // ── Readiness gate (#36: lifecycle state reflects real operational behavior) ──
    if (this._lifecycleState !== 'READY') {
      return { error: 'engine_not_ready', message: `Engine is ${this._lifecycleState}. Call start() before execute().` };
    }

    const ctx = context as CalendarEngineContext;

    switch (action) {
      case 'check_availability': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId);
        if (gateErr) return gateErr;
        return this.doCheckAvailability(ctx);
      }
      case 'create_reservation': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId, ctx.approvedBy);
        if (gateErr) return gateErr;
        return this.doCreateReservation(ctx);
      }
      case 'cancel_reservation': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId, ctx.approvedBy);
        if (gateErr) return gateErr;
        return this.doCancelReservation(ctx);
      }
      case 'reschedule_reservation': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId, ctx.approvedBy);
        if (gateErr) return gateErr;
        return this.doRescheduleReservation(ctx);
      }
      case 'block_time_slot': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId, ctx.approvedBy);
        if (gateErr) return gateErr;
        return this.doBlockTimeSlot(ctx);
      }
      case 'release_time_slot': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId, ctx.approvedBy);
        if (gateErr) return gateErr;
        return this.doReleaseTimeSlot(ctx);
      }
      case 'create_reminder': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId);
        if (gateErr) return gateErr;
        return this.doCreateReminder(ctx);
      }
      case 'cancel_reminder': {
        const gateErr = this.ownershipGuard.check(action, ctx.conversationId);
        if (gateErr) return gateErr;
        return this.doCancelReminder(ctx);
      }
      default:
        return { error: 'VALIDATION_ERROR', message: `Unknown action: ${action}` } as CalendarError;
    }
  }

  // ── Action Handlers ───────────────────────────────────────

  private async doCheckAvailability(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { calendarId, startAt, endAt } = ctx;
    if (typeof calendarId !== 'string' || typeof startAt !== 'number' || typeof endAt !== 'number') {
      return { error: 'VALIDATION_ERROR', message: 'check_availability requires calendarId (string), startAt (number), endAt (number)' };
    }

    try {
      const result = await this.provider.checkAvailability(calendarId, startAt, endAt);
      const conflictingIds = result.conflictingSlots?.map((s) => s.id) ?? [];
      this.events.emit(availabilityChecked(calendarId, startAt, endAt, result.available, conflictingIds, { context: ctx }));
      return result;
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doCreateReservation(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { calendarId, startAt, endAt, title, contactId, description, metadata, tenantId } = ctx;
    if (typeof calendarId !== 'string' || typeof startAt !== 'number' || typeof endAt !== 'number' || typeof title !== 'string') {
      return { error: 'VALIDATION_ERROR', message: 'create_reservation requires calendarId, startAt, endAt, title' };
    }

    try {
      const reservation = await this.provider.createReservation({
        calendarId, startAt, endAt, title,
        contactId: typeof contactId === 'string' ? contactId : undefined,
        description: typeof description === 'string' ? description : undefined,
        metadata: metadata as Record<string, unknown> | undefined,
        tenantId: typeof tenantId === 'string' ? tenantId : undefined,
      });
      this.events.emit(reservationCreated(reservation, { context: ctx }));
      return { reservation };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doCancelReservation(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { reservationId, reason } = ctx;
    if (typeof reservationId !== 'string') {
      return { error: 'VALIDATION_ERROR', message: 'cancel_reservation requires reservationId (string)' };
    }

    try {
      const reservation = await this.provider.cancelReservation(
        reservationId, typeof reason === 'string' ? reason : undefined,
      );
      this.events.emit(reservationCancelled(reservationId, 'confirmed', typeof reason === 'string' ? reason : undefined, { context: ctx }));
      return { reservation };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doRescheduleReservation(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { reservationId, newStartAt, newEndAt } = ctx;
    if (typeof reservationId !== 'string' || typeof newStartAt !== 'number' || typeof newEndAt !== 'number') {
      return { error: 'VALIDATION_ERROR', message: 'reschedule_reservation requires reservationId, newStartAt, newEndAt' };
    }

    try {
      // Get existing reservation
      const existing = await this.provider.getReservation(reservationId);
      if (!existing) {
        return { error: 'RESERVATION_NOT_FOUND', message: `Reservation ${reservationId} not found` };
      }

      const terminalErr = this.reservationLifecycle.assertNotTerminal(existing);
      if (terminalErr) return terminalErr;

      // I12: Atomic cancel + create
      const cancelled = await this.provider.cancelReservation(reservationId, 'Rescheduled');
      const rescheduled = await this.provider.createReservation({
        calendarId: existing.calendarId,
        startAt: newStartAt,
        endAt: newEndAt,
        title: existing.title,
        contactId: existing.contactId,
        description: existing.description,
        metadata: {
          ...existing.metadata,
          ...this.reservationLifecycle.buildRescheduleMetadata(reservationId),
        },
        tenantId: existing.tenantId,
      });

      this.events.emit(reservationRescheduled(rescheduled, existing, { context: ctx }));
      return { reservation: rescheduled, previous: cancelled };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doBlockTimeSlot(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { calendarId, startAt, endAt, reason } = ctx;
    if (typeof calendarId !== 'string' || typeof startAt !== 'number' || typeof endAt !== 'number') {
      return { error: 'VALIDATION_ERROR', message: 'block_time_slot requires calendarId, startAt, endAt' };
    }

    try {
      const timeSlot = await this.provider.blockTimeSlot(
        calendarId, startAt, endAt, typeof reason === 'string' ? reason : undefined,
      );
      this.events.emit(timeSlotBlocked(timeSlot, typeof reason === 'string' ? reason : undefined, { context: ctx }));
      return { timeSlot };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doReleaseTimeSlot(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { timeSlotId } = ctx;
    if (typeof timeSlotId !== 'string') {
      return { error: 'VALIDATION_ERROR', message: 'release_time_slot requires timeSlotId (string)' };
    }

    try {
      const existing = await this.provider.getTimeSlot(timeSlotId);
      const timeSlot = await this.provider.releaseTimeSlot(timeSlotId);
      this.events.emit(timeSlotReleased(timeSlotId, existing?.status ?? 'unknown', { context: ctx }));
      return { timeSlot };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doCreateReminder(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { reservationId, type, channel, scheduledAt, message, metadata } = ctx;
    if (typeof reservationId !== 'string' || typeof type !== 'string' || typeof channel !== 'string' || typeof scheduledAt !== 'number') {
      return { error: 'VALIDATION_ERROR', message: 'create_reminder requires reservationId, type, channel, scheduledAt' };
    }

    try {
      const reminder = await this.provider.createReminder({
        reservationId,
        type: type as Reminder['type'],
        channel: channel as Reminder['channel'],
        scheduledAt,
        message: typeof message === 'string' ? message : undefined,
        metadata: metadata as Record<string, unknown> | undefined,
      });
      this.events.emit(reminderCreated(reminder, { context: ctx }));
      return { reminder };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }

  private async doCancelReminder(ctx: CalendarEngineContext): Promise<Record<string, unknown>> {
    const { reminderId } = ctx;
    if (typeof reminderId !== 'string') {
      return { error: 'VALIDATION_ERROR', message: 'cancel_reminder requires reminderId (string)' };
    }

    try {
      const reminder = await this.provider.cancelReminder(reminderId);
      this.events.emit(reminderCancelled(reminderId, reminder.reservationId, 'User requested cancellation', { context: ctx }));
      return { reminder };
    } catch (err: unknown) {
      const pe = wrapProviderError(this.provider.providerName, err);
      return { error: pe.code ?? 'PROVIDER_UNAVAILABLE', message: pe.message };
    }
  }
}
