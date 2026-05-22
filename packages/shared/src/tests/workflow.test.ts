import { describe, it, expect } from 'vitest';
import { createExecutionContext } from '../runtime/ExecutionContext';
import { createWorkflowState } from '../workflow/WorkflowState';
import type { StepResult } from '../workflow/WorkflowContext';

describe('ExecutionContext (merged — RT-2.4)', () => {
  it('debe crear contexto con defaults', () => {
    const ctx = createExecutionContext({
      workflowId: 'wf_test' as never,
      executionId: 'exec_test' as never,
    });

    expect(ctx.workflowId).toBe('wf_test');
    expect(ctx.executionId).toBe('exec_test');
    expect(ctx.currentState).toBe('idle');
    expect(ctx.steps).toEqual([]);
    expect(ctx.input).toEqual({});
    expect(ctx.state).toEqual({});
    expect(ctx.metadata).toEqual({});
  });

  it('debe soportar steps con resultados', () => {
    const step: StepResult = {
      stepId: 'step-buffer',
      stepName: 'Process Buffer',
      status: 'completed',
      output: { messageCount: 3 },
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
      attempts: 1,
    };

    const ctx = createExecutionContext({
      workflowId: 'wf_w1' as never,
      executionId: 'exec_e1' as never,
      steps: [step],
    });

    expect(ctx.steps).toHaveLength(1);
    expect(ctx.steps[0].status).toBe('completed');
    expect(ctx.steps[0].output?.messageCount).toBe(3);
  });

  it('debe soportar tenantId y verticalId', () => {
    const ctx = createExecutionContext({
      workflowId: 'wf_dental' as never,
      executionId: 'exec_e1' as never,
      tenantId: 'tnt_clinica1' as never,
      verticalId: 'dental',
    });

    expect(ctx.tenantId).toBe('tnt_clinica1');
    expect(ctx.verticalId).toBe('dental');
  });

  it('debe rastrear cambio de estado', () => {
    const ctx = createExecutionContext({
      workflowId: 'wf_w1' as never,
      executionId: 'exec_e1' as never,
      currentState: 'processing',
      previousState: 'buffering',
    });

    expect(ctx.currentState).toBe('processing');
    expect(ctx.previousState).toBe('buffering');
  });

  it('steps debe registrar errores', () => {
    const failedStep: StepResult = {
      stepId: 'step-1',
      stepName: 'Failing Step',
      status: 'failed',
      error: 'Engine not found',
      startedAt: Date.now(),
      attempts: 3,
    };

    const ctx = createExecutionContext({
      workflowId: 'wf_w1' as never,
      executionId: 'exec_e1' as never,
      steps: [failedStep],
    });

    expect(ctx.steps[0].status).toBe('failed');
    expect(ctx.steps[0].error).toBe('Engine not found');
    expect(ctx.steps[0].attempts).toBe(3);
  });
});

describe('CanonicalWorkflowState', () => {
  it('debe crear estado con defaults', () => {
    const state = createWorkflowState('wf_test' as never, 'idle');

    expect(state.workflowId).toBe('wf_test');
    expect(state.currentState).toBe('idle');
    expect(state.visitCount).toBe(1);
    expect(state.enteredAt).toBeLessThanOrEqual(Date.now());
    expect(state.metadata).toEqual({});
  });

  it('debe rastrear previousState', () => {
    const now = Date.now();
    const state = createWorkflowState('wf_w1' as never, 'processing', {
      previousState: 'idle',
      enteredAt: now - 1000,
      exitedAt: now,
    });

    expect(state.previousState).toBe('idle');
    expect(state.enteredAt).toBe(now - 1000);
    expect(state.exitedAt).toBe(now);
  });

  it('debe incrementar visitCount', () => {
    const state = createWorkflowState('wf_w1' as never, 'idle', { visitCount: 5 });
    expect(state.visitCount).toBe(5);
  });

  it('metadata debe ser extensible', () => {
    const state = createWorkflowState('wf_w1' as never, 'escalating', {
      metadata: { escalatedBy: 'legal_rule', priority: 1 },
    });

    expect(state.metadata.escalatedBy).toBe('legal_rule');
    expect(state.metadata.priority).toBe(1);
  });
});
