import { describe, it, expect, beforeEach } from 'vitest';
import { OwnershipManager } from '../ownership/OwnershipManager';
import type { ConversationOwner } from '../types';

describe('OwnershipManager', () => {
  let manager: OwnershipManager;

  beforeEach(() => {
    manager = new OwnershipManager();
  });

  it('debe inicializar conversación con AI ownership', () => {
    const state = manager.getOrCreate('conv-1');
    expect(state.owner).toBe('AI');
    expect(state.handoffState).toBe('AI_ACTIVE');
    expect(state.suppressionMode).toBe('NONE');
  });

  it('debe transferir ownership de AI a HUMAN', () => {
    manager.getOrCreate('conv-1');
    const result = manager.transferOwnership('conv-1', 'HUMAN');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('AI');

    const state = manager.getState('conv-1');
    expect(state!.owner).toBe('HUMAN');
  });

  it('debe transferir ownership de HUMAN a AI', () => {
    manager.getOrCreate('conv-1');
    manager.transferOwnership('conv-1', 'HUMAN');

    const result = manager.transferOwnership('conv-1', 'AI');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('HUMAN');
    expect(manager.getState('conv-1')!.owner).toBe('AI');
  });

  it('debe fallar al transferir al mismo owner', () => {
    manager.getOrCreate('conv-1');

    const result = manager.transferOwnership('conv-1', 'AI');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already set to AI');
  });

  it('LOCKED debe prevenir cualquier transferencia', () => {
    manager.getOrCreate('conv-1');
    manager.setLocked('conv-1');

    const result = manager.transferOwnership('conv-1', 'HUMAN');

    expect(result.success).toBe(false);
    expect(result.error).toContain('LOCKED');
    expect(manager.getState('conv-1')!.owner).toBe('LOCKED');
  });

  it('debe listar conversaciones por owner', () => {
    manager.getOrCreate('conv-ai-1');
    manager.getOrCreate('conv-ai-2');
    manager.getOrCreate('conv-human');
    manager.transferOwnership('conv-human', 'HUMAN');
    manager.getOrCreate('conv-locked');
    manager.setLocked('conv-locked');

    expect(manager.listByOwner('AI')).toEqual(['conv-ai-1', 'conv-ai-2']);
    expect(manager.listByOwner('HUMAN')).toEqual(['conv-human']);
    expect(manager.listByOwner('LOCKED')).toEqual(['conv-locked']);
  });

  it('isOwnedBy debe verificar ownership correctamente', () => {
    manager.getOrCreate('conv-1');
    expect(manager.isOwnedBy('conv-1', 'AI')).toBe(true);
    expect(manager.isOwnedBy('conv-1', 'HUMAN')).toBe(false);

    manager.transferOwnership('conv-1', 'HUMAN');
    expect(manager.isOwnedBy('conv-1', 'AI')).toBe(false);
    expect(manager.isOwnedBy('conv-1', 'HUMAN')).toBe(true);
  });

  it('debe retornar undefined para conversación desconocida', () => {
    expect(manager.getState('no-existe')).toBeUndefined();
  });

  it('clear debe eliminar estado', () => {
    manager.getOrCreate('conv-1');
    manager.clear('conv-1');
    expect(manager.getState('conv-1')).toBeUndefined();
  });

  it('setLocked debe retornar previous owner', () => {
    manager.getOrCreate('conv-1');
    manager.transferOwnership('conv-1', 'HUMAN');

    const result = manager.setLocked('conv-1');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('HUMAN');
  });
});

// ── RT-4: HandoffEngine Lifecycle + Ownership Authority ──

import { HandoffEngine } from '../engine/HandoffEngine';

function makeOwnerEngine() {
  const events: DomainEvent[] = [];
  const engine = new HandoffEngine({
    defaultTimeoutMs: 300_000,
    maxQueueSize: 10,
    policies: {
      vertical: 'test',
      rules: [],
      targets: [],
      defaultTimeoutMs: 300_000,
      maxQueueSize: 10,
    },
    emitFn: (e) => events.push(e),
  });
  return { engine, events };
}

import type { DomainEvent } from '@curdeeclau/shared';

describe('RT-4 HandoffEngine — lifecycle gates', () => {
  it('should reject execute() before start()', async () => {
    const { engine } = makeOwnerEngine();

    const result = await engine.execute('get_ownership', {
      conversationId: 'conv_test',
    });
    expect(result.error).toBe('engine_not_ready');
    expect((result as any).message).toContain('UNINITIALIZED');
  });

  it('should reject execute() after stop()', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();
    await engine.stop();

    const result = await engine.execute('get_ownership', {
      conversationId: 'conv_test',
    });
    expect(result.error).toBe('engine_not_ready');
    expect((result as any).message).toContain('STOPPED');
  });

  it('should allow execute() after start()', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('get_ownership', {
      conversationId: 'conv_test',
    });
    expect(result.error).toBeUndefined();
    expect(result.owner).toBe('AI');
  });

  it('should expose lifecycleState', async () => {
    const { engine } = makeOwnerEngine();
    expect(engine.lifecycleState).toBe('UNINITIALIZED');
    await engine.start();
    expect(engine.lifecycleState).toBe('READY');
    await engine.stop();
    expect(engine.lifecycleState).toBe('STOPPED');
  });
});

describe('RT-4 HandoffEngine — ownership authority', () => {
  it('should default to AI for unknown conversation', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('get_ownership', {
      conversationId: 'conv_unknown',
    });
    expect(result.owner).toBe('AI');
    expect(result.sequence).toBe(0);
  });

  it('should set ownership from AI to HUMAN', async () => {
    const { engine, events } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
      initiatedBy: 'usr_001',
    });
    expect(result.owner).toBe('HUMAN');
    expect(result.previousOwner).toBe('AI');
    expect(result.sequence).toBe(1);
    expect(result.cause).toBe('handoff_accepted');

    // Verify OwnershipChanged event emitted
    const evt = events.find((e) => e.type === 'OwnershipChanged');
    expect(evt).toBeDefined();
    expect((evt!.payload as any).owner).toBe('HUMAN');
    expect((evt!.payload as any).previousOwner).toBe('AI');
    expect((evt!.payload as any).sequence).toBe(1);
    expect((evt!.payload as any).cause).toBe('handoff_accepted');

    // Verify get_ownership reflects the change
    const getResult = await engine.execute('get_ownership', {
      conversationId: 'conv_test',
    });
    expect(getResult.owner).toBe('HUMAN');
    expect(getResult.sequence).toBe(1);
  });

  it('should set ownership from HUMAN to AI (recovery)', async () => {
    const { engine, events } = makeOwnerEngine();
    await engine.start();

    await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
    });

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'AI',
      cause: 'supervisor_release',
    });
    expect(result.owner).toBe('AI');
    expect(result.previousOwner).toBe('HUMAN');
    expect(result.sequence).toBe(2);
  });

  it('should set ownership to SHARED', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'SHARED',
      cause: 'co_pilot_activated',
    });
    expect(result.owner).toBe('SHARED');
    expect(result.previousOwner).toBe('AI');
  });

  it('should set ownership to LOCKED', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'LOCKED',
      cause: 'compliance_lock',
    });
    expect(result.owner).toBe('LOCKED');
  });

  it('should reject transition from LOCKED', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'LOCKED',
      cause: 'compliance_lock',
    });

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'AI',
      cause: 'compliance_unlock',
    });
    expect(result.error).toBe('OWNERSHIP_LOCKED');
  });

  it('should reject identity transitions', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
      owner: 'AI',
      cause: 'system_init',
    });
    expect(result.error).toBe('OWNERSHIP_LOCKED');
  });

  it('should increment sequence monotonically per conversation', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    await engine.execute('set_ownership', {
      conversationId: 'conv_a',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
    });
    await engine.execute('set_ownership', {
      conversationId: 'conv_a',
      owner: 'AI',
      cause: 'supervisor_release',
    });
    await engine.execute('set_ownership', {
      conversationId: 'conv_b',
      owner: 'HUMAN',
      cause: 'handoff_accepted',
    });

    const a = await engine.execute('get_ownership', { conversationId: 'conv_a' });
    const b = await engine.execute('get_ownership', { conversationId: 'conv_b' });
    expect(a.sequence).toBe(2);
    expect(b.sequence).toBe(1);
  });

  it('should reject set_ownership with missing owner', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      conversationId: 'conv_test',
    });
    expect(result.error).toBe('VALIDATION_ERROR');
  });

  it('should reject set_ownership with missing conversationId', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('set_ownership', {
      owner: 'HUMAN',
    });
    expect(result.error).toBe('VALIDATION_ERROR');
  });

  it('should reject unknown action', async () => {
    const { engine } = makeOwnerEngine();
    await engine.start();

    const result = await engine.execute('unknown_action', {});
    expect(result.error).toBe('VALIDATION_ERROR');
  });
});
