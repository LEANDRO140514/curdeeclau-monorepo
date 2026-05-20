// ── Calendar Engine Types ───────────────────────────────
//
// Provider-agnostic temporal coordination types.
// All entity shapes come from @curdeeclau/shared.
// This file defines engine-specific types: config, errors, inputs, provider interface.

import type {
  DomainEvent, RuntimeEventType, Calendar, AvailabilityWindow, TimeSlot, TimeSlotStatus,
  Reservation, ReservationStatus, Reminder, ReminderType, ReminderChannel, ReminderStatus,
  CalendarId, TimeSlotId, ReservationId, ReminderId, ContactId, ConversationOwner,
} from '@curdeeclau/shared';

export type { DomainEvent, Calendar, AvailabilityWindow, TimeSlot, TimeSlotStatus, Reservation, ReservationStatus, Reminder, ConversationOwner };
export type { CalendarId, TimeSlotId, ReservationId, ReminderId, ContactId };

// ── Event Types ──────────────────────────────────────────

export type CalendarEventType = Extract<RuntimeEventType,
  | 'AvailabilityChecked'
  | 'ReservationCreated'
  | 'ReservationCancelled'
  | 'ReservationRescheduled'
  | 'TimeSlotBlocked'
  | 'TimeSlotReleased'
  | 'ReminderCreated'
  | 'ReminderTriggered'
  | 'ReminderCancelled'
>;

// ── Error Codes ──────────────────────────────────────────

export type CalendarErrorCode =
  | 'TIME_SLOT_UNAVAILABLE'
  | 'INVALID_TIMEZONE'
  | 'CALENDAR_NOT_FOUND'
  | 'RESERVATION_NOT_FOUND'
  | 'TIME_SLOT_NOT_FOUND'
  | 'REMINDER_NOT_FOUND'
  | 'ALREADY_CANCELLED'
  | 'RESERVATION_TERMINAL'
  | 'INVALID_TIME_RANGE'
  | 'OWNERSHIP_LOCKED'
  | 'OWNERSHIP_INSUFFICIENT'
  | 'APPROVAL_REQUIRED'
  | 'INVALID_REMINDER_TIME'
  | 'REMINDER_TIME_IN_PAST'
  | 'REMINDER_ALREADY_CANCELLED'
  | 'TIME_SLOT_NOT_BLOCKED'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR';

// ── Structured Results ───────────────────────────────────

export interface CalendarError {
  error: CalendarErrorCode;
  message: string;
  [key: string]: unknown;
}

export function isCalendarError(result: unknown): result is CalendarError {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return typeof r.error === 'string' && typeof r.message === 'string';
}

// ── Availability ─────────────────────────────────────────

export interface AvailabilityResult {
  available: boolean;
  conflictingSlots?: TimeSlot[];
  [key: string]: unknown;
}

// ── Input Types ──────────────────────────────────────────

export interface CreateCalendarInput {
  name: string;
  timezone: string;
  availabilityWindows?: Omit<AvailabilityWindow, 'id' | 'calendarId'>[];
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface CheckAvailabilityInput {
  calendarId: string;
  startAt: number;
  endAt: number;
}

export interface CreateReservationInput {
  calendarId: string;
  startAt: number;
  endAt: number;
  title: string;
  contactId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  tenantId?: string;
}

export interface CancelReservationInput {
  reservationId: string;
  reason?: string;
}

export interface RescheduleReservationInput {
  reservationId: string;
  newStartAt: number;
  newEndAt: number;
}

export interface BlockTimeSlotInput {
  calendarId: string;
  startAt: number;
  endAt: number;
  reason?: string;
}

export interface ReleaseTimeSlotInput {
  timeSlotId: string;
}

export interface CreateReminderInput {
  reservationId: string;
  type: ReminderType;
  channel: ReminderChannel;
  scheduledAt: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface CancelReminderInput {
  reminderId: string;
}

// ── Calendar Provider Interface ──────────────────────────

export interface CalendarProvider {
  readonly providerName: string;

  // Calendar
  getCalendar(id: string): Promise<Calendar | undefined>;
  createCalendar(data: CreateCalendarInput): Promise<Calendar>;

  // Availability
  checkAvailability(calendarId: string, startAt: number, endAt: number): Promise<AvailabilityResult>;

  // Reservations
  createReservation(data: CreateReservationInput): Promise<Reservation>;
  cancelReservation(id: string, reason?: string): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | undefined>;
  findReservations(calendarId: string, startAt: number, endAt: number): Promise<Reservation[]>;

  // Time Slots
  blockTimeSlot(calendarId: string, startAt: number, endAt: number, reason?: string): Promise<TimeSlot>;
  releaseTimeSlot(id: string): Promise<TimeSlot>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;

  // Reminders
  createReminder(data: CreateReminderInput): Promise<Reminder>;
  cancelReminder(id: string): Promise<Reminder>;
  getReminders(reservationId: string): Promise<Reminder[]>;
}

// ── Engine Config ────────────────────────────────────────

export interface CalendarEngineConfig {
  provider: CalendarProvider;
  ownershipResolver?: (conversationId: string) => ConversationOwner;
}

// ── Engine Context ───────────────────────────────────────

export interface CalendarEngineContext {
  conversationId?: string;
  tenantId?: string;
  workflowId?: string;
  correlationId?: string;
  causationId?: string;
  actorId?: string;
  verticalId?: string;
  approvedBy?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ── Valid Timezones ──────────────────────────────────────

const IANA_TIMEZONES = new Set([
  'UTC', 'America/Mexico_City', 'America/Cancun', 'America/Monterrey',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Buenos_Aires',
  'America/Sao_Paulo', 'Europe/Madrid', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland',
]);

export function isValidTimezone(tz: string): boolean {
  return IANA_TIMEZONES.has(tz);
}
