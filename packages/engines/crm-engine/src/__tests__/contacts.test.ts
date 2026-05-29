// ── CRM Engine: Contact Tests ─────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMEngine } from '../engine/CRMEngine';
import { InMemoryCRMProvider } from '../providers/memory/InMemoryCRMProvider';
import type { CRMEngineContext } from '../types';

function makeContext(overrides: Partial<CRMEngineContext> = {}): CRMEngineContext {
  return {
    conversationId: 'conv_test',
    tenantId: 'tnt_test',
    correlationId: 'corr_test',
    actorId: 'usr_test',
    ...overrides,
  };
}

describe('ContactManager', () => {
  let engine: CRMEngine;
  let provider: InMemoryCRMProvider;

  beforeEach(async () => {
    provider = new InMemoryCRMProvider();
    engine = new CRMEngine({ provider });
    await engine.start();
  });

  it('should create a contact and emit ContactCreated event', async () => {
    const ctx = makeContext();
    const result = await engine.execute('create_contact', { ...ctx, name: 'María García', phone: '+525512345678' });

    expect(result).toHaveProperty('contact');
    const contact = (result as any).contact;
    expect(contact.name).toBe('María García');
    expect(contact.phone).toBe('+525512345678');
    expect(contact.id).toMatch(/^cnt_/);
    expect(contact.tags).toEqual([]);

    // Event emitted
    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ContactCreated');
    expect(events[0].payload).toHaveProperty('contact');
  });

  it('should update a contact and emit ContactUpdated event', async () => {
    const ctx = makeContext();

    // Create first
    const created = await engine.execute('create_contact', { ...ctx, name: 'Original', phone: '+525511111111' });
    const contactId = (created as any).contact.id;
    engine.getEvents().clear();

    // Update
    const result = await engine.execute('update_contact', {
      ...ctx,
      contactId,
      changes: { name: 'Updated Name', email: 'test@example.com' },
    });

    expect(result).toHaveProperty('contact');
    const contact = (result as any).contact;
    expect(contact.name).toBe('Updated Name');
    expect(contact.email).toBe('test@example.com');

    // Event emitted with changes and previous
    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ContactUpdated');
    const payload = events[0].payload as any;
    expect(payload.contactId).toBe(contactId);
    expect(payload.changes.name).toBe('Updated Name');
    expect(payload.previous.name).toBe('Original');
  });

  it('should return CONTACT_NOT_FOUND for update on missing contact', async () => {
    const result = await engine.execute('update_contact', {
      ...makeContext(),
      contactId: 'cnt_nonexistent',
      changes: { name: 'Ghost' },
    });

    expect(result).toHaveProperty('error', 'CONTACT_NOT_FOUND');
  });

  it('should validate inputs (name required)', async () => {
    const result = await engine.execute('create_contact', { ...makeContext(), phone: '123' });

    expect(result).toHaveProperty('error', 'VALIDATION_ERROR');
  });
});
