import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../CalendarEngine';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';

async function createEngine() {
  const provider = new InMemoryCalendarProvider();
  const engine = new CalendarEngine({ provider });
  await engine.start();
  // Seed HUMAN ownership so mutations are allowed
  engine.handleOwnershipChanged({
    conversationId: 'conv_test', owner: 'HUMAN', previousOwner: null,
    sequence: 1, cause: 'system_init', changedAt: Date.now(),
  });
  return { engine, provider };
}

async function setupReservation(engine: CalendarEngine) {
  const provider = (engine as any).provider as InMemoryCalendarProvider;
  const cal = await provider.createCalendar({
    name: 'Reminder Test',
    timezone: 'America/Mexico_City',
    availabilityWindows: [{
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '18:00',
      slotDurationMs: 60 * 60 * 1000,
    }],
  });
  const tomorrow = new Date(Date.now() + 86400000);
  const startAt = new Date(tomorrow).setHours(10, 0, 0, 0);
  const endAt = new Date(tomorrow).setHours(11, 0, 0, 0);
  const rsvResult = await engine.execute('create_reservation', {
    calendarId: cal.id, conversationId: 'conv_test',
    startAt, endAt, title: 'Test Reservation',
  });
  return { calendarId: cal.id, reservation: rsvResult.reservation as any, startAt, endAt };
}

describe('Reminder lifecycle', () => {
  let engine: CalendarEngine;

  beforeEach(async () => {
    const s = await createEngine();
    engine = s.engine;
  });

  it('should create reminder for existing reservation (I17)', async () => {
    const { reservation } = await setupReservation(engine);
    const future = reservation.startAt - 3600000; // 1 hour before

    const result = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: future,
      message: 'Your appointment is in 1 hour',
    });

    expect(result.error).toBeUndefined();
    expect(result.reminder).toBeDefined();
    if (result.reminder) {
      const rmd = result.reminder as any;
      expect(rmd.id).toMatch(/^rmd_/);
      expect(rmd.status).toBe('scheduled');
      expect(rmd.type).toBe('upcoming');
      expect(rmd.channel).toBe('whatsapp');
    }
  });

  it('should reject reminder for non-existent reservation (I17)', async () => {
    const result = await engine.execute('create_reminder', {
      reservationId: 'rsv_nonexistent',
      conversationId: 'conv_test',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: Date.now() + 86400000,
    });
    expect(result.error).toBe('RESERVATION_NOT_FOUND');
  });

  it('should reject upcoming reminder after startAt (I18)', async () => {
    const { reservation } = await setupReservation(engine);
    const result = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: reservation.startAt + 1000,
    });
    expect(result.error).toBe('INVALID_REMINDER_TIME');
  });

  it('should reject follow-up reminder before endAt (I19)', async () => {
    const { reservation } = await setupReservation(engine);
    const result = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'follow_up',
      channel: 'email',
      scheduledAt: reservation.endAt - 1000,
    });
    expect(result.error).toBe('INVALID_REMINDER_TIME');
  });

  it('should reject reminder in the past (I20)', async () => {
    const { reservation } = await setupReservation(engine);
    const result = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'custom',
      channel: 'sms',
      scheduledAt: 1, // Way in the past
    });
    expect(result.error).toBe('REMINDER_TIME_IN_PAST');
  });

  it('should cancel reminder', async () => {
    const { reservation } = await setupReservation(engine);
    const created = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: reservation.startAt - 3600000,
    });
    const rmdId = (created.reminder as any).id;

    const result = await engine.execute('cancel_reminder', {
      reminderId: rmdId,
      conversationId: 'conv_test',
    });
    expect(result.error).toBeUndefined();
    if (result.reminder) {
      expect((result.reminder as any).status).toBe('cancelled');
    }
  });

  it('should reject cancel for already cancelled reminder', async () => {
    const { reservation } = await setupReservation(engine);
    const created = await engine.execute('create_reminder', {
      reservationId: reservation.id,
      conversationId: 'conv_test',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: reservation.startAt - 3600000,
    });
    const rmdId = (created.reminder as any).id;
    await engine.execute('cancel_reminder', { reminderId: rmdId, conversationId: 'conv_test' });

    const second = await engine.execute('cancel_reminder', {
      reminderId: rmdId,
      conversationId: 'conv_test',
    });
    expect(second.error).toBe('REMINDER_ALREADY_CANCELLED');
  });
});
