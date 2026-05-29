import { describe, it, expect, beforeEach } from 'vitest';
import { OwnershipGuard } from '../runtime/OwnershipGuard';
import { CalendarEngine } from '../CalendarEngine';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';
import type { ConversationOwner } from '@curdeeclau/shared';

function seedView(entries: Array<[string, ConversationOwner]>): Map<string, ConversationOwner> {
  return new Map(entries);
}

describe('OwnershipGuard — permission matrix', () => {
  // I24: LOCKED blocks all writes
  it('LOCKED should allow reads only (I24)', () => {
    const view = seedView([['conv_locked', 'LOCKED']]);
    const guard = new OwnershipGuard(view);

    expect(guard.check('check_availability', 'conv_locked')).toBeNull();
    expect(guard.check('create_reservation', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('cancel_reservation', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('reschedule_reservation', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('block_time_slot', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('release_time_slot', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('create_reminder', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('cancel_reminder', 'conv_locked')?.error).toBe('OWNERSHIP_LOCKED');
  });

  // I25: AI can only read + reminders
  it('AI should allow reads and reminders only (I25)', () => {
    const view = seedView([['conv_ai', 'AI']]);
    const guard = new OwnershipGuard(view);

    expect(guard.check('check_availability', 'conv_ai')).toBeNull();
    expect(guard.check('create_reminder', 'conv_ai')).toBeNull();
    expect(guard.check('cancel_reminder', 'conv_ai')).toBeNull();
    expect(guard.check('create_reservation', 'conv_ai')?.error).toBe('OWNERSHIP_INSUFFICIENT');
    expect(guard.check('cancel_reservation', 'conv_ai')?.error).toBe('OWNERSHIP_INSUFFICIENT');
    expect(guard.check('block_time_slot', 'conv_ai')?.error).toBe('OWNERSHIP_INSUFFICIENT');
  });

  // I26: SHARED requires approval for mutations
  it('SHARED should require approval for mutations (I26)', () => {
    const view = seedView([['conv_shared', 'SHARED']]);
    const guard = new OwnershipGuard(view);

    expect(guard.check('create_reservation', 'conv_shared')?.error).toBe('APPROVAL_REQUIRED');
    expect(guard.check('cancel_reservation', 'conv_shared')?.error).toBe('APPROVAL_REQUIRED');
    expect(guard.check('reschedule_reservation', 'conv_shared')?.error).toBe('APPROVAL_REQUIRED');
    // With approval, should pass
    expect(guard.check('create_reservation', 'conv_shared', 'usr_approver')).toBeNull();
    expect(guard.check('cancel_reservation', 'conv_shared', 'usr_approver')).toBeNull();
    // Reads don't need approval
    expect(guard.check('check_availability', 'conv_shared')).toBeNull();
    expect(guard.check('create_reminder', 'conv_shared')).toBeNull();
  });

  // I27: HUMAN has full access
  it('HUMAN should have full access (I27)', () => {
    const view = seedView([['conv_human', 'HUMAN']]);
    const guard = new OwnershipGuard(view);

    const actions = [
      'check_availability', 'create_reservation', 'cancel_reservation',
      'reschedule_reservation', 'block_time_slot', 'release_time_slot',
      'create_reminder', 'cancel_reminder',
    ];
    for (const action of actions) {
      expect(guard.check(action, 'conv_human')).toBeNull();
    }
  });

  it('getAllowedActions should return correct permissions', () => {
    const view = seedView([
      ['conv_locked', 'LOCKED'],
      ['conv_ai', 'AI'],
      ['conv_human', 'HUMAN'],
      ['conv_shared', 'SHARED'],
    ]);
    const guard = new OwnershipGuard(view);

    expect(guard.getAllowedActions('conv_locked')).toEqual({ read: true, reminders: false, mutations: false });
    expect(guard.getAllowedActions('conv_ai')).toEqual({ read: true, reminders: true, mutations: false });
    expect(guard.getAllowedActions('conv_human')).toEqual({ read: true, reminders: true, mutations: true });
    expect(guard.getAllowedActions('conv_shared')).toEqual({ read: true, reminders: true, mutations: true });
  });

  it('should default to AI when conversationId is absent', () => {
    const guard = new OwnershipGuard(new Map());
    // No conversationId → defaults to AI
    expect(guard.check('check_availability')).toBeNull();
    expect(guard.check('create_reminder')).toBeNull();
    expect(guard.check('create_reservation')?.error).toBe('OWNERSHIP_INSUFFICIENT');
  });
});

describe('CalendarEngine — ownership gating', () => {
  let engine: CalendarEngine;

  beforeEach(async () => {
    engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
    });
    await engine.start();
  });

  it('should block mutation under LOCKED ownership', async () => {
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'LOCKED', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const result = await engine.execute('create_reservation', {
      calendarId: 'cal_001',
      conversationId: 'conv_test',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
      title: 'Should fail',
    });
    expect(result.error).toBe('OWNERSHIP_LOCKED');
  });

  it('should allow read under LOCKED ownership', async () => {
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'LOCKED', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const result = await engine.execute('check_availability', {
      calendarId: 'cal_001',
      conversationId: 'conv_test',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    // Ownership gate passed (reads allowed), but calendar doesn't exist
    expect(result.error).toBe('CALENDAR_NOT_FOUND');
  });

  it('should block reservation creation under AI ownership', async () => {
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'AI', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const result = await engine.execute('create_reservation', {
      calendarId: 'cal_001',
      conversationId: 'conv_test',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
      title: 'Should fail',
    });
    expect(result.error).toBe('OWNERSHIP_INSUFFICIENT');
  });

  it('should allow availability check under AI ownership', async () => {
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'AI', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const result = await engine.execute('check_availability', {
      calendarId: 'cal_001',
      conversationId: 'conv_test',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    // Ownership gate passed (reads allowed), but calendar doesn't exist
    expect(result.error).toBe('CALENDAR_NOT_FOUND');
  });

  it('should require approval under SHARED ownership', async () => {
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'SHARED', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });

    const noApproval = await engine.execute('create_reservation', {
      calendarId: 'cal_001', conversationId: 'conv_test',
      startAt: 1, endAt: 2, title: 'Test',
    });
    expect(noApproval.error).toBe('APPROVAL_REQUIRED');

    const withApproval = await engine.execute('create_reservation', {
      calendarId: 'cal_001', conversationId: 'conv_test',
      startAt: 1, endAt: 2, title: 'Test', approvedBy: 'usr_001',
    });
    // Ownership gate passed, but calendar doesn't exist
    expect(withApproval.error).toBe('CALENDAR_NOT_FOUND');
  });

  it('should reject execute() before start()', async () => {
    const coldEngine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
    });

    const result = await coldEngine.execute('check_availability', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    expect(result.error).toBe('engine_not_ready');
    expect(result.message).toContain('UNINITIALIZED');
  });

  it('should reject execute() after stop()', async () => {
    await engine.stop();

    const result = await engine.execute('check_availability', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    expect(result.error).toBe('engine_not_ready');
    expect(result.message).toContain('STOPPED');
  });
});
