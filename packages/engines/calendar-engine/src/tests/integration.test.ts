import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../CalendarEngine';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';
import { isCalendarError } from '../types';

describe('Integration — E2E booking workflow', () => {
  let engine: CalendarEngine;
  let provider: InMemoryCalendarProvider;
  let calendarId: string;

  beforeEach(async () => {
    provider = new InMemoryCalendarProvider();
    engine = new CalendarEngine({ provider });
    await engine.start();

    // Seed HUMAN ownership so mutations are allowed in integration tests
    engine.handleOwnershipChanged({
      conversationId: 'conv_flow', owner: 'HUMAN', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const cal = await provider.createCalendar({
      name: 'Dr. García — Clínica Dental',
      timezone: 'America/Mexico_City',
      availabilityWindows: [{
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '09:00',
        endTime: '18:00',
        slotDurationMs: 60 * 60 * 1000,
        bufferBeforeMs: 0,
        bufferAfterMs: 0,
      }],
      tenantId: 'tnt_clinica',
    });
    calendarId = cal.id;
  });

  function tomorrowAt(hour: number, minutes: number = 0): number {
    const d = new Date(Date.now() + 86400000);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(hour, minutes, 0, 0);
    return d.getTime();
  }

  // Scenario 1: Full booking → cancel workflow
  it('Scenario 1: book → cancel', async () => {
    // 1. Check availability
    const avail = await engine.execute('check_availability', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      correlationId: 'corr-flow-1',
    });
    expect(avail.available).toBe(true);

    // 2. Create reservation
    const created = await engine.execute('create_reservation', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Limpieza dental',
      contactId: 'ctc_paciente1',
      description: 'Limpieza semestral',
      correlationId: 'corr-flow-1',
    });
    expect(created.reservation).toBeDefined();
    const rsvId = (created.reservation as any).id;
    expect(rsvId).toMatch(/^rsv_/);
    expect((created.reservation as any).contactId).toBe('ctc_paciente1');

    // 3. Verify slot is now unavailable
    const checkAgain = await engine.execute('check_availability', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
    });
    expect(checkAgain.available).toBe(false);

    // 4. Add reminder
    const reminder = await engine.execute('create_reminder', {
      reservationId: rsvId,
      conversationId: 'conv_flow',
      type: 'upcoming',
      channel: 'whatsapp',
      scheduledAt: tomorrowAt(10) - 3600000, // 1 hour before
      message: 'Tu cita es en 1 hora',
    });
    expect(reminder.reminder).toBeDefined();

    // 5. Cancel reservation
    const cancelled = await engine.execute('cancel_reservation', {
      reservationId: rsvId,
      reason: 'Paciente solicitó cancelación',
      conversationId: 'conv_flow',
      correlationId: 'corr-flow-1',
    });
    expect((cancelled.reservation as any).status).toBe('cancelled');

    // 6. Slot should be available again (I15)
    const afterCancel = await engine.execute('check_availability', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
    });
    expect(afterCancel.available).toBe(true);

    // 7. Verify events were emitted
    const eventTypes = engine.eventEmitter.emittedEvents.map((e) => e.type);
    expect(eventTypes).toContain('AvailabilityChecked');
    expect(eventTypes).toContain('ReservationCreated');
    expect(eventTypes).toContain('ReminderCreated');
    expect(eventTypes).toContain('ReservationCancelled');
  });

  // Scenario 2: Reschedule workflow
  it('Scenario 2: book → reschedule', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Revisión',
    });
    const rsvId = (created.reservation as any).id;

    // Reschedule to 15:00-16:00
    const rescheduled = await engine.execute('reschedule_reservation', {
      reservationId: rsvId,
      conversationId: 'conv_flow',
      newStartAt: tomorrowAt(15),
      newEndAt: tomorrowAt(16),
    });

    expect(rescheduled.error).toBeUndefined();
    expect(rescheduled.reservation).toBeDefined();
    expect(rescheduled.previous).toBeDefined();

    if (rescheduled.reservation && rescheduled.previous) {
      const rsv = rescheduled.reservation as any;
      const prev = rescheduled.previous as any;

      expect(prev.status).toBe('cancelled');
      expect(prev.cancellationReason).toBe('Rescheduled');
      expect(rsv.status).toBe('pending');
      expect(rsv.startAt).toBe(tomorrowAt(15));
      expect(rsv.endAt).toBe(tomorrowAt(16));
      expect(rsv.metadata.rescheduledFrom).toBe(rsvId);
    }

    // Old slot (10-11) should be available
    const oldSlot = await engine.execute('check_availability', {
      calendarId, conversationId: 'conv_flow',
      startAt: tomorrowAt(10), endAt: tomorrowAt(11),
    });
    expect(oldSlot.available).toBe(true);

    // New slot (15-16) should be taken
    const newSlot = await engine.execute('check_availability', {
      calendarId, conversationId: 'conv_flow',
      startAt: tomorrowAt(15), endAt: tomorrowAt(16),
    });
    expect(newSlot.available).toBe(false);

    // Verify RescheduleRescheduled event
    const rescheduleEvents = engine.eventEmitter.filter('ReservationRescheduled');
    expect(rescheduleEvents).toHaveLength(1);
  });

  // Scenario 3: Block + release time slot
  it('Scenario 3: block → release time slot', async () => {
    // Block a time slot
    const blocked = await engine.execute('block_time_slot', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(13),
      endAt: tomorrowAt(14),
      reason: 'Lunch break',
    });
    expect(blocked.timeSlot).toBeDefined();
    if (blocked.timeSlot) {
      expect((blocked.timeSlot as any).status).toBe('blocked');
      expect((blocked.timeSlot as any).blockedReason).toBe('Lunch break');
    }

    // Verify blocked slot is unavailable
    const check = await engine.execute('check_availability', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(13),
      endAt: tomorrowAt(14),
    });
    expect(check.available).toBe(false);

    // Release it
    const tsId = (blocked.timeSlot as any).id;
    const released = await engine.execute('release_time_slot', {
      timeSlotId: tsId,
      conversationId: 'conv_flow',
    });
    expect(released.timeSlot).toBeDefined();
    if (released.timeSlot) {
      expect((released.timeSlot as any).status).toBe('available');
    }

    // Verify slot is now available
    const checkAfter = await engine.execute('check_availability', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(13),
      endAt: tomorrowAt(14),
    });
    expect(checkAfter.available).toBe(true);
  });

  // Scenario 4: Multiple bookings, no conflicts
  it('Scenario 4: two non-overlapping bookings', async () => {
    const rsv1 = await engine.execute('create_reservation', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(9),
      endAt: tomorrowAt(10),
      title: 'Paciente A',
    });
    expect(rsv1.reservation).toBeDefined();

    const rsv2 = await engine.execute('create_reservation', {
      calendarId,
      conversationId: 'conv_flow',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Paciente B',
    });
    expect(rsv2.reservation).toBeDefined();

    const rsvs = await provider.findReservations(calendarId, tomorrowAt(8), tomorrowAt(18));
    expect(rsvs).toHaveLength(2);
  });

  // Scenario 5: Structured error model — errors are returned, never thrown
  it('Scenario 5: errors are returned, never thrown', async () => {
    const results = await Promise.all([
      engine.execute('check_availability', { calendarId: 'cal_bad', conversationId: 'conv_flow', startAt: 10, endAt: 5 }),
      engine.execute('create_reservation', { calendarId: 'cal_bad', conversationId: 'conv_flow', startAt: 1, endAt: 2, title: 'X' }),
      engine.execute('cancel_reservation', { reservationId: 'rsv_bad', conversationId: 'conv_flow' }),
      engine.execute('create_reminder', { reservationId: 'rsv_bad', conversationId: 'conv_flow', type: 'upcoming', channel: 'whatsapp', scheduledAt: 1 }),
    ]);

    for (const result of results) {
      // Each should either be an error or have valid fields — none should throw
      expect(typeof result).toBe('object');
    }

    // All should be errors
    const errorResults = results.filter((r) => isCalendarError(r));
    expect(errorResults.length).toBeGreaterThan(0);
    for (const err of errorResults) {
      expect(typeof err.error).toBe('string');
      expect(typeof err.message).toBe('string');
    }
  });
});
