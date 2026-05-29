import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../CalendarEngine';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';
import { CalendarEventEmitter } from '../runtime/CalendarEventEmitter';

async function createEngine() {
  const provider = new InMemoryCalendarProvider();
  const engine = new CalendarEngine({ provider });
  await engine.start();
  // Seed HUMAN ownership for mutation tests
  engine.handleOwnershipChanged({
    conversationId: 'conv_orch', owner: 'HUMAN', previousOwner: null,
    sequence: 1, cause: 'system_init', changedAt: Date.now(),
  });
  return { engine, provider, events: engine.eventEmitter };
}

function tomorrowAt(hour: number): number {
  const d = new Date(Date.now() + 86400000);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

async function setupCalendar(engine: CalendarEngine) {
  const provider = (engine as any).provider as InMemoryCalendarProvider;
  return provider.createCalendar({
    name: 'Orch Test',
    timezone: 'America/Mexico_City',
    availabilityWindows: [{
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:59',
      slotDurationMs: 60 * 60 * 1000,
    }],
  });
}

describe('CalendarEngine — Engine contract', () => {
  it('should expose engineName', async () => {
    const { engine } = await createEngine();
    expect(engine.engineName).toBe('calendar-engine');
  });

  it('should expose lifecycleState', async () => {
    const { engine } = await createEngine();
    expect(engine.lifecycleState).toBe('READY');
  });

  it('should implement execute()', async () => {
    const { engine, provider } = await createEngine();
    const cal = await provider.createCalendar({
      name: 'Test', timezone: 'UTC',
      availabilityWindows: [{ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59', slotDurationMs: 3600000 }],
    });
    const result = await engine.execute('check_availability', {
      calendarId: cal.id, conversationId: 'conv_orch',
      startAt: tomorrowAt(10), endAt: tomorrowAt(11),
    });
    expect(result).toBeDefined();
  });

  it('should return error for unknown action', async () => {
    const { engine } = await createEngine();
    const result = await engine.execute('do_something_crazy', {});
    expect(result.error).toBe('VALIDATION_ERROR');
  });
});

describe('CalendarEngine — event emission (I28-I30)', () => {
  let engine: CalendarEngine;
  let events: CalendarEventEmitter;
  let calId: string;

  beforeEach(async () => {
    const s = await createEngine();
    engine = s.engine;
    events = s.events;
    const cal = await setupCalendar(engine);
    calId = cal.id;
  });

  it('should emit AvailabilityChecked on check_availability (I28)', async () => {
    events.clear();
    await engine.execute('check_availability', {
      calendarId: calId,
      conversationId: 'conv_orch',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
    });
    const last = events.lastOfType('AvailabilityChecked');
    expect(last).toBeDefined();
    expect(last!.type).toBe('AvailabilityChecked');
  });

  it('should emit ReservationCreated on create_reservation (I28)', async () => {
    events.clear();
    await engine.execute('create_reservation', {
      calendarId: calId,
      conversationId: 'conv_orch',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Event test',
    });
    const created = events.lastOfType('ReservationCreated');
    expect(created).toBeDefined();
  });

  it('should emit ReservationCancelled on cancel (I28)', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId: calId, conversationId: 'conv_orch',
      startAt: tomorrowAt(10), endAt: tomorrowAt(11), title: 'Cancel test',
    });
    const rsvId = (created.reservation as any).id;
    events.clear();

    await engine.execute('cancel_reservation', {
      reservationId: rsvId,
      conversationId: 'conv_orch',
    });
    const cancelled = events.lastOfType('ReservationCancelled');
    expect(cancelled).toBeDefined();
    if (cancelled?.payload) {
      expect((cancelled.payload as any).reservationId).toBe(rsvId);
    }
  });

  it('should emit ReminderCreated on create_reminder (I28)', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId: calId, conversationId: 'conv_orch',
      startAt: tomorrowAt(10), endAt: tomorrowAt(11), title: 'Reminder test',
    });
    const rsvId = (created.reservation as any).id;
    events.clear();

    await engine.execute('create_reminder', {
      reservationId: rsvId, conversationId: 'conv_orch',
      type: 'upcoming', channel: 'whatsapp',
      scheduledAt: tomorrowAt(10) - 1800000,
    });
    const reminderEvent = events.lastOfType('ReminderCreated');
    expect(reminderEvent).toBeDefined();
  });

  it('should carry correlationId when provided in context (I29)', async () => {
    events.clear();
    await engine.execute('check_availability', {
      calendarId: calId,
      conversationId: 'conv_orch',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      correlationId: 'corr-workflow-123',
    });
    const last = events.lastOfType('AvailabilityChecked');
    expect(last).toBeDefined();
    expect(last!.correlationId).toBe('corr-workflow-123');
  });

  it('should carry actorId when provided in context (I30)', async () => {
    events.clear();
    await engine.execute('check_availability', {
      calendarId: calId,
      conversationId: 'conv_orch',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      actorId: 'usr_eva',
    });
    const last = events.lastOfType('AvailabilityChecked');
    expect(last).toBeDefined();
    expect(last!.actorId).toBe('usr_eva');
  });

  it('should emit all required fields on DomainEvent', async () => {
    events.clear();
    await engine.execute('check_availability', {
      calendarId: calId,
      conversationId: 'conv_orch',
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      tenantId: 'tnt_001',
      workflowId: 'wf_xyz',
      correlationId: 'corr_chain',
    });
    const e = events.lastOfType('AvailabilityChecked');
    expect(e).toBeDefined();
    expect(e!.id).toMatch(/^evt_/);
    expect(e!.type).toBe('AvailabilityChecked');
    expect(typeof e!.timestamp).toBe('number');
  });
});
