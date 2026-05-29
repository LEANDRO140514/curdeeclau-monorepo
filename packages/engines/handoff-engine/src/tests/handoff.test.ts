import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandoffEngine } from '../engine/HandoffEngine';
import { HandoffPolicyEvaluator } from '../policies/HandoffPolicyEvaluator';
import type { DomainEvent } from '@curdeeclau/shared';
import type { HandoffPolicySet, HandoffEvalContext, HandoffEventPayload } from '../types';

const dentalPolicies: HandoffPolicySet = {
  vertical: 'dental',
  description: 'Test policies',
  rules: [
    {
      id: 'hpol-001',
      name: 'Legal Mention',
      priority: 1,
      conditions: [
        { field: 'keyword', operator: 'contains', value: ['demanda', 'abogado', 'negligencia'] },
      ],
      target: { type: 'human', id: 'directora-clinica', name: 'Directora Clínica' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-002',
      name: 'Critical Emergency',
      priority: 2,
      conditions: [
        { field: 'escalationLevel', operator: 'equals', value: 'critical' },
      ],
      target: { type: 'human', id: 'recepcionista-senior', name: 'Recepcionista Senior' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-003',
      name: 'Human Request',
      priority: 4,
      conditions: [
        { field: 'keyword', operator: 'contains', value: ['humano', 'persona', 'hablar con alguien'] },
      ],
      target: { type: 'human', id: 'recepcionista-turno', name: 'Recepcionista en Turno' },
      cooldownMs: 100,
      enabled: true,
    },
    {
      id: 'hpol-004',
      name: 'After Hours',
      priority: 6,
      conditions: [
        { field: 'timeOfDay', operator: 'gte', value: '19:00' },
      ],
      target: { type: 'human', id: 'recepcionista-guardia', name: 'Recepcionista de Guardia' },
      cooldownMs: 0,
      enabled: false,
    },
  ],
  targets: [
    { type: 'human', id: 'directora-clinica', name: 'Directora Clínica' },
    { type: 'human', id: 'recepcionista-senior', name: 'Recepcionista Senior' },
    { type: 'human', id: 'recepcionista-turno', name: 'Recepcionista en Turno' },
    { type: 'human', id: 'recepcionista-guardia', name: 'Recepcionista de Guardia' },
  ],
  defaultTimeoutMs: 300_000,
  maxQueueSize: 10,
};

async function makeEngine(policies?: HandoffPolicySet) {
  const events: DomainEvent[] = [];
  const engine = new HandoffEngine({
    defaultTimeoutMs: 300_000,
    maxQueueSize: 10,
    policies: policies ?? dentalPolicies,
    emitFn: (e) => events.push(e),
  });
  await engine.start();
  return { engine, events };
}

describe('HandoffPolicyEvaluator', () => {
  it('debe evaluar reglas y retornar matches por prioridad', () => {
    const evaluator = new HandoffPolicyEvaluator();
    evaluator.loadPolicies(dentalPolicies);

    const ctx: HandoffEvalContext = {
      conversationId: 'c1',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'high',
      keywords: ['demanda'],
    };

    const matches = evaluator.evaluate(ctx);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('hpol-001');
    expect(matches[0].priority).toBe(1);
  });

  it('debe matchear por escalationLevel', () => {
    const evaluator = new HandoffPolicyEvaluator();
    evaluator.loadPolicies(dentalPolicies);

    const ctx: HandoffEvalContext = {
      conversationId: 'c2',
      trigger: 'EMERGENCY',
      escalationLevel: 'critical',
    };

    const matches = evaluator.evaluate(ctx);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('hpol-002');
  });

  it('no debe matchear reglas disabled', () => {
    const evaluator = new HandoffPolicyEvaluator();
    evaluator.loadPolicies(dentalPolicies);

    const ctx: HandoffEvalContext = {
      conversationId: 'c3',
      trigger: 'AFTER_HOURS',
      escalationLevel: 'low',
      timeOfDay: '20:00',
    };

    const matches = evaluator.evaluate(ctx);
    expect(matches).toHaveLength(0);
  });

  it('debe retornar vacío si no hay policies cargadas', () => {
    const evaluator = new HandoffPolicyEvaluator();

    const ctx: HandoffEvalContext = {
      conversationId: 'c4',
      trigger: 'HUMAN_REQUEST',
      escalationLevel: 'low',
    };

    expect(evaluator.evaluate(ctx)).toEqual([]);
  });

  it('debe ordenar múltiples matches por prioridad', () => {
    const evaluator = new HandoffPolicyEvaluator();
    evaluator.loadPolicies({
      ...dentalPolicies,
      rules: [
        {
          id: 'low-prio',
          name: 'Low',
          priority: 10,
          conditions: [{ field: 'escalationLevel', operator: 'equals', value: 'high' }],
          target: { type: 'human', id: 't1', name: 'T1' },
          enabled: true,
        },
        {
          id: 'high-prio',
          name: 'High',
          priority: 1,
          conditions: [{ field: 'escalationLevel', operator: 'equals', value: 'high' }],
          target: { type: 'human', id: 't2', name: 'T2' },
          enabled: true,
        },
      ],
    });

    const ctx: HandoffEvalContext = {
      conversationId: 'c5',
      trigger: 'KNOWLEDGE_GAP',
      escalationLevel: 'high',
    };

    const matches = evaluator.evaluate(ctx);
    expect(matches).toHaveLength(2);
    expect(matches[0].id).toBe('high-prio');
    expect(matches[1].id).toBe('low-prio');
  });
});

describe('HandoffEngine — evaluate flow', () => {
  it('debe generar handoff por trigger válido (LEGAL_RISK)', async () => {
    const { engine, events } = await makeEngine();

    const result = await engine.evaluate({
      conversationId: 'conv-001',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'high',
      keywords: ['abogado', 'demanda'],
    });

    expect(result.accepted).toBe(true);
    expect(result.previousOwner).toBe('AI');
    expect(result.newOwner).toBe('AI');
    expect(result.state).toBe('HANDOFF_PENDING');
    expect(result.request.matchedRuleId).toBe('hpol-001');

    const requested = events.find((e) => e.type === 'HandoffRequested');
    expect(requested).toBeDefined();
    expect((requested!.payload as HandoffEventPayload).trigger).toBe('LEGAL_RISK');
  });

  it('debe generar handoff por EMERGENCY critical', async () => {
    const { engine, events } = await makeEngine();

    const result = await engine.evaluate({
      conversationId: 'conv-002',
      trigger: 'EMERGENCY',
      escalationLevel: 'critical',
    });

    expect(result.accepted).toBe(true);
    expect(result.suppressionMode).toBe('FULL_SUPPRESSION');
    expect(result.request.matchedRuleId).toBe('hpol-002');

    const suppressionEvt = events.find((e) => e.type === 'SuppressionActivated');
    expect(suppressionEvt).toBeDefined();
    expect((suppressionEvt!.payload as HandoffEventPayload).suppressionMode).toBe('FULL_SUPPRESSION');
  });

  it('debe manejar trigger inválido (sin match)', async () => {
    const { engine } = await makeEngine();

    const result = await engine.evaluate({
      conversationId: 'conv-003',
      trigger: 'LOW_CONFIDENCE',
      escalationLevel: 'low',
    });

    expect(result.accepted).toBe(false);
    expect(result.request.status).toBe('rejected');
  });

  it('debe emitir eventos de lifecycle completos', async () => {
    const { engine, events } = await makeEngine();

    await engine.evaluate({
      conversationId: 'conv-lifecycle',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'legal',
      keywords: ['negligencia'],
    });

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('HandoffRequested');
    expect(eventTypes).toContain('SuppressionActivated');

    const suppressionEvt = events.find((e) => e.type === 'SuppressionActivated');
    expect((suppressionEvt!.payload as HandoffEventPayload).suppressionMode).toBe('FULL_SUPPRESSION');
  });

  it('debe respetar cooldown de reglas', async () => {
    const { engine } = await makeEngine();

    const ctx: HandoffEvalContext = {
      conversationId: 'conv-cooldown',
      trigger: 'HUMAN_REQUEST',
      escalationLevel: 'medium',
      keywords: ['hablar con alguien'],
    };

    const r1 = await engine.evaluate(ctx);
    expect(r1.accepted).toBe(true);
    expect(r1.request.matchedRuleId).toBe('hpol-003');

    const r2 = await engine.evaluate(ctx);
    expect(r2.accepted).toBe(false);
    expect(r2.request.status).toBe('rejected');
  });
});

describe('HandoffEngine — accept / reject flow', () => {
  it('debe aceptar handoff pendiente y cambiar ownership a HUMAN', async () => {
    const { engine, events } = await makeEngine();

    await engine.evaluate({
      conversationId: 'conv-accept',
      trigger: 'EMERGENCY',
      escalationLevel: 'critical',
    });

    const result = await engine.accept('conv-accept');

    expect(result.accepted).toBe(true);
    expect(result.newOwner).toBe('HUMAN');
    expect(result.state).toBe('HUMAN_ACTIVE');

    const acceptedEvt = events.find((e) => e.type === 'HandoffAccepted');
    expect(acceptedEvt).toBeDefined();
  });

  it('debe rechazar handoff y restaurar AI', async () => {
    const { engine, events } = await makeEngine();

    await engine.evaluate({
      conversationId: 'conv-reject',
      trigger: 'HUMAN_REQUEST',
      escalationLevel: 'medium',
      keywords: ['humano'],
    });

    const result = await engine.reject('conv-reject');

    expect(result.accepted).toBe(false);
    expect(result.newOwner).toBe('AI');
    expect(result.state).toBe('AI_ACTIVE');
    expect(result.suppressionMode).toBe('NONE');

    const rejectedEvt = events.find((e) => e.type === 'HandoffRejected');
    expect(rejectedEvt).toBeDefined();
  });

  it('debe cerrar handoff correctamente', async () => {
    const { engine, events } = await makeEngine();

    await engine.evaluate({
      conversationId: 'conv-close',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'high',
      keywords: ['abogado'],
    });

    const result = await engine.close('conv-close');

    expect(result.state).toBe('HANDOFF_CLOSED');
    const closedEvt = events.find((e) => e.type === 'HandoffClosed');
    expect(closedEvt).toBeDefined();
  });
});

describe('HandoffEngine — execute (engine contract)', () => {
  it('debe ejecutar vía execute con action evaluate', async () => {
    const { engine } = await makeEngine();

    const result = await engine.execute('evaluate', {
      conversationId: 'conv-exec',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'high',
      keywords: ['demanda'],
    });

    expect((result as Record<string, unknown>).accepted).toBe(true);
  });

  it('debe retornar error estructurado con action desconocido', async () => {
    const { engine } = await makeEngine();

    const result = await engine.execute('unknown_action', { conversationId: 'c1' });
    expect(result).toEqual({ error: 'VALIDATION_ERROR', message: 'Unknown handoff action: unknown_action' });
  });
});
