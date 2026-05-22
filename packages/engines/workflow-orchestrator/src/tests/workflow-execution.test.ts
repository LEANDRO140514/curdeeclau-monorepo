import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowExecutor } from '../runtime/WorkflowExecutor';
import { InMemoryEngineRegistry } from '../registry/EngineRegistry';
import { StateResolver } from '../runtime/StateResolver';
import { createEvent } from '../events/DomainEvent';
import type { Engine, WorkflowDefinition, WorkflowContext, StateMachine } from '../types';

const testMachine: StateMachine = {
  id: 'test-machine',
  verticalId: 'dental',
  version: '1.0.0',
  initial: 'idle',
  states: [
    {
      name: 'idle',
      transitions: [
        { event: 'ConversationReadyToFlush', target: 'buffering' },
        { event: 'process_buffer', target: 'processing' },
        { event: 'send_response', target: 'completed_state' },
      ],
    },
    {
      name: 'buffering',
      transitions: [
        { event: 'process_buffer', target: 'processing' },
      ],
    },
    {
      name: 'processing',
      transitions: [
        { event: 'send_response', target: 'completed_state' },
      ],
    },
    {
      name: 'completed_state',
      transitions: [],
    },
  ],
};

const singleStepWorkflow: WorkflowDefinition = {
  id: 'wf-single-step',
  name: 'Single Step Test',
  version: '1.0.0',
  verticalId: 'dental',
  steps: [
    {
      id: 'step-1',
      name: 'Process buffer',
      type: 'action',
      engine: 'message-buffer',
      action: 'process_buffer',
    },
  ],
};

const multiStepWorkflow: WorkflowDefinition = {
  id: 'wf-multi-step',
  name: 'Multi Step Test',
  version: '1.0.0',
  verticalId: 'dental',
  steps: [
    {
      id: 'step-1',
      name: 'Process buffer',
      type: 'action',
      engine: 'message-buffer',
      action: 'process_buffer',
    },
    {
      id: 'step-2',
      name: 'Send response',
      type: 'action',
      engine: 'message-buffer',
      action: 'send_response',
    },
  ],
};

function makeMockEngine(name: string, outputs: Record<string, unknown> = {}): Engine {
  return {
    engineName: name,
    execute: vi.fn().mockImplementation(async (action: string) => {
      if (outputs[action] instanceof Error) throw outputs[action];
      return outputs[action] ?? { action, status: 'ok' };
    }),
  };
}

function makeContext(overrides: Partial<WorkflowContext> = {}): WorkflowContext {
  return {
    workflowId: 'wf-test',
    executionId: 'exec-test-1',
    verticalId: 'dental',
    currentState: 'idle',
    input: {},
    state: {},
    steps: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
    ...overrides,
  };
}

describe('WorkflowExecutor — single step', () => {
  let engines: InMemoryEngineRegistry;
  let stateResolver: StateResolver;
  let emitFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    engines = new InMemoryEngineRegistry();
    stateResolver = new StateResolver();
    stateResolver.loadStateMachine(testMachine);
    emitFn = vi.fn();
  });

  it('debe ejecutar un step simple', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(singleStepWorkflow, makeContext());

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].status).toBe('completed');
    expect(result.steps[0].stepId).toBe('step-1');
    expect(engine.execute).toHaveBeenCalledWith('process_buffer', expect.any(Object));
  });

  it('debe emitir WorkflowStarted y WorkflowCompleted', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    await executor.execute(singleStepWorkflow, makeContext());

    const eventTypes = emitFn.mock.calls.map((c: unknown[]) => (c[0] as { type: string }).type);
    expect(eventTypes).toContain('WorkflowStepExecuted');
    expect(eventTypes).toContain('WorkflowCompleted');
  });

  it('debe fallar si engine no existe', async () => {
    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(singleStepWorkflow, makeContext());

    expect(result.steps[0].status).toBe('failed');
    expect(result.steps[0].error).toContain('not found');
  });

  it('debe manejar error de engine', async () => {
    const engine = makeMockEngine('message-buffer', {
      process_buffer: new Error('Buffer crash'),
    });
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(singleStepWorkflow, makeContext());

    expect(result.steps[0].status).toBe('failed');
    expect(result.steps[0].error).toBe('Buffer crash');
  });
});

describe('WorkflowExecutor — multi step', () => {
  let engines: InMemoryEngineRegistry;
  let stateResolver: StateResolver;
  let emitFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    engines = new InMemoryEngineRegistry();
    stateResolver = new StateResolver();
    stateResolver.loadStateMachine(testMachine);
    emitFn = vi.fn();
  });

  it('debe ejecutar múltiples steps en orden', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(multiStepWorkflow, makeContext());

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].status).toBe('completed');
    expect(result.steps[1].status).toBe('completed');

    const calls = (engine.execute as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('process_buffer');
    expect(calls[1][0]).toBe('send_response');
  });

  it('debe avanzar estados a través de múltiples steps', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(multiStepWorkflow, makeContext());

    expect(result.currentState).toBe('completed_state');
  });

  it('debe emitir eventos por cada step', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    await executor.execute(multiStepWorkflow, makeContext());

    const stepEvents = emitFn.mock.calls
      .map((c: unknown[]) => (c[0] as { type: string }).type)
      .filter((t: string) => t === 'WorkflowStepExecuted');

    expect(stepEvents).toHaveLength(2);
  });

  it('debe transicionar estado con evento trigger', async () => {
    const engine = makeMockEngine('message-buffer');
    engines.register(engine);

    const trigger = createEvent('ConversationReadyToFlush', { conversationId: 'c1' });
    const executor = new WorkflowExecutor(engines, stateResolver, emitFn);
    const result = await executor.execute(singleStepWorkflow, makeContext(), trigger);

    expect(result.currentState).toBe('processing');
  });
});
