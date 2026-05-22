import type { DomainEvent, Engine } from '@curdeeclau/shared';
import type {
  WorkflowDefinition,
  WorkflowContext,
  StateMachine,
  OrchestratorConfig,
  IWorkflowOrchestrator,
  EventDispatcher as EventDispatcherInterface,
} from '../types';
import { DEFAULT_ORCHESTRATOR_CONFIG } from '../types';
import { InMemoryEngineRegistry } from '../registry/EngineRegistry';
import { InMemoryWorkflowRegistry } from '../registry/WorkflowRegistry';
import { InMemoryEventDispatcher } from '../runtime/EventDispatcher';
import { StateResolver } from '../runtime/StateResolver';
import { WorkflowExecutor } from '../runtime/WorkflowExecutor';
import { createEvent } from '../events/DomainEvent';

export class WorkflowOrchestrator implements IWorkflowOrchestrator {
  private config: OrchestratorConfig;
  private engineRegistry: InMemoryEngineRegistry;
  private workflowRegistry: InMemoryWorkflowRegistry;
  private eventDispatcher: InMemoryEventDispatcher;
  private stateResolver: StateResolver;
  private executor: WorkflowExecutor;
  private contexts: Map<string, WorkflowContext> = new Map();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.engineRegistry = new InMemoryEngineRegistry();
    this.workflowRegistry = new InMemoryWorkflowRegistry();
    this.eventDispatcher = new InMemoryEventDispatcher();
    this.stateResolver = new StateResolver();
    this.executor = new WorkflowExecutor(
      this.engineRegistry,
      this.stateResolver,
      (event) => this.eventDispatcher.dispatch(event),
    );
  }

  // ── Configuration ─────────────────────────────────────

  loadWorkflow(definition: WorkflowDefinition): void {
    this.workflowRegistry.register(definition);
  }

  loadStateMachine(machine: StateMachine): void {
    this.stateResolver.loadStateMachine(machine);
  }

  registerEngine(engine: Engine): void {
    this.engineRegistry.register(engine);
  }

  getDispatcher(): EventDispatcherInterface {
    return this.eventDispatcher;
  }

  // ── Execution ─────────────────────────────────────────

  async execute(
    workflowId: string,
    input?: Record<string, unknown>,
  ): Promise<WorkflowContext> {
    const definition = this.workflowRegistry.get(workflowId);
    if (!definition) {
      throw new Error(`Workflow "${workflowId}" not found`);
    }

    const executionId = `exec-${workflowId}-${Date.now()}`;
    const initial = this.stateResolver.getInitialState();

    const context: WorkflowContext = {
      workflowId: workflowId as WorkflowContext['workflowId'],
      executionId: executionId as WorkflowContext['executionId'],
      verticalId: definition.verticalId,
      currentState: initial,
      input: input ?? {},
      state: { ...(definition.initialState ?? {}), ...(input ?? {}) },
      steps: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
    };

    await this.eventDispatcher.dispatch(
      createEvent('WorkflowStarted', {
        workflowId,
        correlationId: executionId,
        payload: { executionId, input },
      }),
    );

    const result = await this.executor.execute(definition, context);
    this.contexts.set(executionId, result);

    return result;
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    await this.eventDispatcher.dispatch(event);

    if (event.workflowId && event.type === 'ConversationReadyToFlush') {
      await this.execute(event.workflowId, {
        conversationId: event.conversationId,
        correlationId: event.correlationId,
        triggerEvent: event.type,
        payload: event.payload,
      });
    }
  }

  // ── Query ─────────────────────────────────────────────

  getState(executionId: string): WorkflowContext | undefined {
    return this.contexts.get(executionId);
  }

  getEngineNames(): string[] {
    return this.engineRegistry.list();
  }

  getWorkflowIds(): string[] {
    return this.workflowRegistry.list();
  }
}
