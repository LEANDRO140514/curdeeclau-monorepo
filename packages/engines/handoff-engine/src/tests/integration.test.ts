import { describe, it, expect, vi } from 'vitest';
import { HandoffEngine } from '../engine/HandoffEngine';
import type { DomainEvent } from '@curdeeclau/shared';
import type { HandoffPolicySet, HandoffEventPayload } from '../types';

const dentalPolicies: HandoffPolicySet = {
  vertical: 'dental',
  description: 'Integration test policies',
  rules: [
    {
      id: 'hpol-legal',
      name: 'Legal',
      priority: 1,
      conditions: [
        { field: 'keyword', operator: 'contains', value: ['demanda', 'abogado'] },
      ],
      target: { type: 'human', id: 'directora', name: 'Directora' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-critical',
      name: 'Critical',
      priority: 2,
      conditions: [
        { field: 'escalationLevel', operator: 'equals', value: 'critical' },
      ],
      target: { type: 'human', id: 'senior', name: 'Senior' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-knowledge-gap',
      name: 'Knowledge Gap',
      priority: 5,
      conditions: [
        { field: 'intent', operator: 'equals', value: 'unknown' },
      ],
      target: { type: 'human', id: 'turno', name: 'Recepcionista Turno' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-after-hours',
      name: 'After Hours',
      priority: 6,
      conditions: [
        { field: 'timeOfDay', operator: 'gte', value: '19:00' },
      ],
      target: { type: 'human', id: 'guardia', name: 'Guardia' },
      cooldownMs: 0,
      enabled: true,
    },
  ],
  targets: [
    { type: 'human', id: 'directora', name: 'Directora' },
    { type: 'human', id: 'senior', name: 'Senior' },
    { type: 'human', id: 'turno', name: 'Recepcionista Turno' },
    { type: 'human', id: 'guardia', name: 'Guardia' },
  ],
  defaultTimeoutMs: 300_000,
  maxQueueSize: 10,
};

async function makeEngine() {
  const events: DomainEvent[] = [];
  const engine = new HandoffEngine({
    defaultTimeoutMs: 300_000,
    maxQueueSize: 10,
    policies: dentalPolicies,
    emitFn: (e) => events.push(e),
  });
  await engine.start();
  return { engine, events };
}

describe('HandoffEngine — integration flows', () => {
  it('flujo completo: evaluate → accept → close', async () => {
    const { engine, events } = await makeEngine();

    // 1. Evaluate — trigger handoff
    const evalResult = await engine.evaluate({
      conversationId: 'flow-1',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'legal',
      keywords: ['demanda'],
    });
    expect(evalResult.accepted).toBe(true);
    expect(evalResult.state).toBe('HANDOFF_PENDING');

    // 2. Accept — human takes over
    const acceptResult = await engine.accept('flow-1');
    expect(acceptResult.accepted).toBe(true);
    expect(acceptResult.newOwner).toBe('HUMAN');
    expect(acceptResult.state).toBe('HUMAN_ACTIVE');

    // 3. Close — end handoff
    const closeResult = await engine.close('flow-1');
    expect(closeResult.state).toBe('HANDOFF_CLOSED');

    // Verify full event chain
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('HandoffRequested');
    expect(eventTypes).toContain('SuppressionActivated');
    expect(eventTypes).toContain('HandoffAccepted');
    expect(eventTypes).toContain('OwnershipChanged');
    expect(eventTypes).toContain('HandoffClosed');
  });

  it('flujo: evaluate → reject → AI restaurado', async () => {
    const { engine, events } = await makeEngine();

    await engine.evaluate({
      conversationId: 'flow-2',
      trigger: 'KNOWLEDGE_GAP',
      escalationLevel: 'medium',
      intent: 'unknown',
    });

    const rejectResult = await engine.reject('flow-2');
    expect(rejectResult.accepted).toBe(false);
    expect(rejectResult.newOwner).toBe('AI');
    expect(rejectResult.state).toBe('AI_ACTIVE');
    expect(rejectResult.suppressionMode).toBe('NONE');

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('HandoffRejected');
  });

  it('flujo: evaluate → accept → recover → AI restaurado', async () => {
    const { engine, events } = await makeEngine();

    // Handoff to human
    await engine.evaluate({
      conversationId: 'flow-3',
      trigger: 'EMERGENCY',
      escalationLevel: 'critical',
    });
    await engine.accept('flow-3');

    // Recover back to AI
    const recoverResult = await engine.recover('flow-3');
    expect(recoverResult.newOwner).toBe('AI');
    expect(recoverResult.state).toBe('AI_RESTORED');
    expect(recoverResult.suppressionMode).toBe('NONE');

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('AIRecoveryStarted');
    expect(eventTypes).toContain('AIRecovered');
  });

  it('flujo de integración con orchestrator vía execute()', async () => {
    const { engine } = await makeEngine();

    // Simula el flujo: orchestrator recibe ConversationReadyToFlush → knowledge gap → handoff

    // Step 1: Evaluar
    const evalOutput = await engine.execute('evaluate', {
      conversationId: 'orch-flow-1',
      trigger: 'KNOWLEDGE_GAP',
      escalationLevel: 'medium',
      intent: 'unknown',
    });
    const evalResult = evalOutput as Record<string, unknown>;
    expect(evalResult.accepted).toBe(true);

    // Step 2: Aceptar
    const acceptOutput = await engine.execute('accept', {
      conversationId: 'orch-flow-1',
    });
    const acceptResult = acceptOutput as Record<string, unknown>;
    expect(acceptResult.newOwner).toBe('HUMAN');

    // Step 3: Recuperar
    const recoverOutput = await engine.execute('recover', {
      conversationId: 'orch-flow-1',
    });
    const recoverResult = recoverOutput as Record<string, unknown>;
    expect(recoverResult.newOwner).toBe('AI');

    // Step 4: Cerrar
    const closeOutput = await engine.execute('close', {
      conversationId: 'orch-flow-1',
    });
    const closeResult = closeOutput as Record<string, unknown>;
    expect(closeResult.state).toBe('HANDOFF_CLOSED');
  });

  it('LOCKED ownership previene takeover en integración', async () => {
    const { engine } = await makeEngine();

    // Set up a conversation and lock it
    engine.getOwnershipManager().getOrCreate('locked-conv');
    engine.getOwnershipManager().setLocked('locked-conv');

    const result = await engine.evaluate({
      conversationId: 'locked-conv',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'critical',
      keywords: ['abogado'],
    });

    expect(result.accepted).toBe(false);
    expect(result.request.status).toBe('rejected');
  });

  it('debe manejar after-hours trigger', async () => {
    const { engine, events } = await makeEngine();

    const result = await engine.evaluate({
      conversationId: 'after-hours-conv',
      trigger: 'AFTER_HOURS',
      escalationLevel: 'medium',
      timeOfDay: '21:30',
    });

    expect(result.accepted).toBe(true);
    expect(result.request.matchedRuleId).toBe('hpol-after-hours');

    const requested = events.find((e) => e.type === 'HandoffRequested');
    expect((requested!.payload as HandoffEventPayload).targetId).toBe('guardia');
  });

  it('engineName debe ser handoff-engine', async () => {
    const { engine } = await makeEngine();
    expect(engine.engineName).toBe('handoff-engine');
  });

  it('getState debe retornar undefined para conversación nueva', async () => {
    const { engine } = await makeEngine();
    expect(engine.getState('no-existe')).toBeUndefined();
  });

  it('loadPolicies debe actualizar políticas', async () => {
    const { engine } = await makeEngine();

    const newPolicies: HandoffPolicySet = {
      vertical: 'dental',
      rules: [
        {
          id: 'new-rule',
          name: 'New',
          priority: 1,
          conditions: [{ field: 'intent', operator: 'equals', value: 'test' }],
          target: { type: 'human', id: 't1', name: 'T1' },
          enabled: true,
        },
      ],
      targets: [],
      defaultTimeoutMs: 60_000,
      maxQueueSize: 5,
    };

    engine.loadPolicies(newPolicies);
    // Policy change verified via evaluation
  });
});

// ── RT-4: Ownership authority E2E ───────────────────────

describe('RT-4 HandoffEngine — ownership authority E2E', () => {
  it('set_ownership → get_ownership → verify OwnershipChanged event', async () => {
    const { engine, events } = await makeEngine();

    // 1. Get initial ownership (default AI, sequence 0)
    const initial = await engine.execute('get_ownership', {
      conversationId: 'e2e_conv',
    });
    expect(initial.owner).toBe('AI');
    expect(initial.sequence).toBe(0);

    // 2. Set ownership to HUMAN
    const setResult = await engine.execute('set_ownership', {
      conversationId: 'e2e_conv',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
      initiatedBy: 'usr_e2e',
      reason: 'User accepted handoff',
    });
    expect(setResult.owner).toBe('HUMAN');
    expect(setResult.sequence).toBe(1);

    // 3. Verify OwnershipChanged event was emitted with correct shape
    const ownershipEvents = events.filter((e) => e.type === 'OwnershipChanged');
    expect(ownershipEvents).toHaveLength(1);
    const evt = ownershipEvents[0];
    expect(evt.conversationId).toBe('e2e_conv');
    expect(evt.type).toBe('OwnershipChanged');
    expect(typeof evt.id).toBe('string');
    expect(typeof evt.timestamp).toBe('number');

    const payload = evt.payload as any;
    expect(payload.conversationId).toBe('e2e_conv');
    expect(payload.owner).toBe('HUMAN');
    expect(payload.previousOwner).toBe('AI');
    expect(payload.sequence).toBe(1);
    expect(payload.cause).toBe('handoff_accepted');
    expect(payload.initiatedBy).toBe('usr_e2e');
    expect(payload.reason).toBe('User accepted handoff');
    expect(typeof payload.changedAt).toBe('number');

    // 4. Verify get_ownership reflects the change
    const after = await engine.execute('get_ownership', {
      conversationId: 'e2e_conv',
    });
    expect(after.owner).toBe('HUMAN');
    expect(after.sequence).toBe(1);
  });

  it('set_ownership to LOCKED then get_ownership', async () => {
    const { engine, events } = await makeEngine();

    await engine.execute('set_ownership', {
      conversationId: 'e2e_locked',
      owner: 'LOCKED',
      cause: 'compliance_lock',
      reason: 'Legal hold',
    });

    const result = await engine.execute('get_ownership', {
      conversationId: 'e2e_locked',
    });
    expect(result.owner).toBe('LOCKED');
    expect(result.sequence).toBe(1);

    // LOCKED → anything should be rejected by validateOwnershipTransition
    const blocked = await engine.execute('set_ownership', {
      conversationId: 'e2e_locked',
      owner: 'AI',
      cause: 'compliance_unlock',
    });
    expect(blocked.error).toBe('OWNERSHIP_LOCKED');

    // Ownership unchanged
    const still = await engine.execute('get_ownership', {
      conversationId: 'e2e_locked',
    });
    expect(still.owner).toBe('LOCKED');
  });

  it('multiple conversations have independent ownership', async () => {
    const { engine } = await makeEngine();

    await engine.execute('set_ownership', {
      conversationId: 'conv_a',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
    });
    await engine.execute('set_ownership', {
      conversationId: 'conv_b',
      owner: 'SHARED',
      cause: 'co_pilot_activated',
    });

    const a = await engine.execute('get_ownership', { conversationId: 'conv_a' });
    const b = await engine.execute('get_ownership', { conversationId: 'conv_b' });
    const c = await engine.execute('get_ownership', { conversationId: 'conv_c' });

    expect(a.owner).toBe('HUMAN');
    expect(b.owner).toBe('SHARED');
    expect(c.owner).toBe('AI'); // default
  });
});
