// ── LeadStore Tests ────────────────────────────────────────
//
// BV-1.02: Lead identification by (channel, channelUserId).
// Verify find-or-create semantics with provider ID registration.

import { describe, it, expect, beforeEach } from 'vitest';
import { LeadStore } from '../LeadStore';

describe('LeadStore — identify(channel, channelUserId)', () => {
  let store: LeadStore;

  beforeEach(() => {
    store = new LeadStore();
  });

  it('debe crear NEW_LEAD en la primera identificación', async () => {
    const result = await store.identify('telegram', '123456789');

    expect(result.status).toBe('NEW_LEAD');
    expect(result.lead.id).toMatch(/^cnt_/);
    expect(result.lead.source).toBe('telegram');
    expect(result.lead.providerIds).toEqual({ telegram: '123456789' });
  });

  it('debe devolver EXISTING_LEAD en la segunda identificación con mismos (channel, channelUserId)', async () => {
    const first = await store.identify('telegram', '123456789');
    const second = await store.identify('telegram', '123456789');

    expect(second.status).toBe('EXISTING_LEAD');
    expect(second.lead.id).toBe(first.lead.id);
  });

  it('debe distinguir leads por canal diferente', async () => {
    const telegram = await store.identify('telegram', '111');
    const whatsapp = await store.identify('whatsapp', '111');

    expect(telegram.status).toBe('NEW_LEAD');
    expect(whatsapp.status).toBe('NEW_LEAD');
    expect(telegram.lead.id).not.toBe(whatsapp.lead.id);
    expect(telegram.lead.providerIds).toEqual({ telegram: '111' });
    expect(whatsapp.lead.providerIds).toEqual({ whatsapp: '111' });
  });

  it('debe distinguir leads por channelUserId diferente en mismo canal', async () => {
    const userA = await store.identify('telegram', 'user_a');
    const userB = await store.identify('telegram', 'user_b');

    expect(userA.status).toBe('NEW_LEAD');
    expect(userB.status).toBe('NEW_LEAD');
    expect(userA.lead.id).not.toBe(userB.lead.id);
  });

  it('cada lead debe tener createdAt y id único', async () => {
    const results = await Promise.all([
      store.identify('telegram', 'u1'),
      store.identify('telegram', 'u2'),
      store.identify('whatsapp', 'u3'),
    ]);

    const ids = results.map((r) => r.lead.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    for (const r of results) {
      expect(r.lead.createdAt).toBeGreaterThan(0);
      expect(r.lead.updatedAt).toBeGreaterThan(0);
    }
  });

  it('debe registrar correctamente providerIds al crear', async () => {
    const result = await store.identify('whatsapp', '5219991234567');

    expect(result.status).toBe('NEW_LEAD');
    expect(result.lead.providerIds).toEqual({ whatsapp: '5219991234567' });
    expect(result.lead.source).toBe('whatsapp');
  });
});
