import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { FSMContext } from "../../core/fsm/fsm.types";
import { FSMEngine } from "../../core/fsm/FSMEngine";
import { FSMTransitionChecker } from "../../core/fsm/FSMTransitionChecker";
import type { LLMResponse } from "../../core/llm/LLMGateway";
import { LLMGateway } from "../../core/llm/LLMGateway";
import type { RAGDocument } from "../../core/rag/RAGService";
import { RAGService } from "../../core/rag/RAGService";
import { Orchestrator } from "../../core/orchestrator/Orchestrator";
import type { LeadRecord } from "../../infra/postgres/LeadsRepository";
import { LeadsRepository } from "../../infra/postgres/LeadsRepository";
import type {
  AIValidator,
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
} from "../../core/validation/AIValidationLayer";
import { BasicAIValidator } from "../../core/validation/AIValidatorImpl";
import { BasicDecisionMatrix } from "../../core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "../../core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "../../core/validation/NoopMetricsPort";
import { ProductionAIValidator } from "../../core/validation/ProductionAIValidator";

/**
 * Tests destructivos a nivel sistema del SafetyPort + ProductionAIValidator.
 *
 * Reglas del juego:
 *   - Se ejecuta el `Orchestrator` real con `BasicHardGate` y
 *     `BasicDecisionMatrix` reales.
 *   - El validator es `ProductionAIValidator` real, envolviendo
 *     `BasicAIValidator` real, con un `SafetyPort` stub controlado por test.
 *   - El HardGate y el enforcement del Orchestrator deben ganar siempre.
 *
 * Mensaje de fallback hardcodeado en `Orchestrator.ts`. NO se importa: si el
 * literal cambia en producción sin actualizar este test, los tests deben
 * fallar para detectar el drift.
 */
const SAFE_FALLBACK_MESSAGE = "Hubo un problema, intenta nuevamente.";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildFSMContext(overrides: Partial<FSMContext> = {}): FSMContext {
  return {
    leadId: "lead-test",
    tenantId: "tenant-test",
    currentState: "INIT",
    message: "hola",
    traceId: "trace-test",
    extractedData: {},
    ...overrides,
  };
}

function stubLeadRecord(overrides: Partial<LeadRecord> = {}): LeadRecord {
  const now = new Date().toISOString();
  return {
    id: "lead-test",
    tenant_id: "tenant-test",
    phone_number: "+10000000000",
    first_name: null,
    email: null,
    tags: {},
    fsm_state: "SUPPORT_RAG",
    ai_confidence_score: 0,
    last_interaction: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeLeadsRepositoryStub(): {
  repo: LeadsRepository;
  updateCalls: () => number;
} {
  let updateCount = 0;
  const repo = {
    findByPhone: async () => null,
    upsertLead: async () => stubLeadRecord(),
    updateFsmState: async () => {
      updateCount += 1;
      return stubLeadRecord();
    },
    insertFromGhl: async () => stubLeadRecord(),
  } as unknown as LeadsRepository;
  return { repo, updateCalls: () => updateCount };
}

class StubSafetyPort implements SafetyPort {
  constructor(
    private readonly impl: (input: SafetyPortInput) => Promise<SafetyPortOutput>,
  ) {}
  evaluate(input: SafetyPortInput): Promise<SafetyPortOutput> {
    return this.impl(input);
  }
}

type BuildOpts = {
  llmResponse?: LLMResponse;
  ragDocuments?: RAGDocument[];
  validator: AIValidator;
};

function buildOrchestrator(opts: BuildOpts): {
  orchestrator: Orchestrator;
  repositoryUpdateCalls: () => number;
} {
  const fsmEngine = new FSMEngine();
  const llm = new LLMGateway();
  const rag = new RAGService({});

  if (opts.llmResponse !== undefined) {
    jest.spyOn(llm, "generate").mockResolvedValue(opts.llmResponse);
  }
  if (opts.ragDocuments !== undefined) {
    const docs = opts.ragDocuments;
    jest
      .spyOn(rag, "query")
      .mockResolvedValue({ documents: docs, usedTopK: docs.length || 5 });
  }

  const leadsStub = makeLeadsRepositoryStub();

  const orchestrator = new Orchestrator({
    leadsRepository: leadsStub.repo,
    fsmEngine,
    llmGateway: llm,
    ragService: rag,
    validator: opts.validator,
    decisionMatrix: new BasicDecisionMatrix(),
    hardGate: new BasicHardGate(),
    fsmTransitionChecker: new FSMTransitionChecker(fsmEngine),
    validationMetrics: new NoopValidationMetricsPort(),
  });

  return {
    orchestrator,
    repositoryUpdateCalls: leadsStub.updateCalls,
  };
}

const SAFE_OUTPUT: SafetyPortOutput = {
  isSafe: true,
  reasonCodes: [],
  labels: [],
};

const UNSAFE_OUTPUT: SafetyPortOutput = {
  isSafe: false,
  reasonCodes: ["unsafe_content"],
  labels: ["hate"],
};

// -----------------------------------------------------------------------------
// Suite
// -----------------------------------------------------------------------------

describe("SafetyPort — destructive system tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // SAFETY-1
  // ---------------------------------------------------------------------------
  it("SAFETY-1: SafetyPort safe + flujo RAG válido → emite texto IA (accept)", async () => {
    const aiPayload = "respuesta del modelo";

    const productionValidator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => SAFE_OUTPUT),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
        { id: "doc-2", content: "more context", score: 0.9 },
      ],
      validator: productionValidator,
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).toBe(aiPayload);
    expect(result.internalDiagnostics?.decisionAction).toBe("accept");
    expect(result.internalDiagnostics?.hardGateBlocked).toBeFalsy();
    expect(repositoryUpdateCalls()).toBe(1); // INIT -> SUPPORT_RAG
  });

  // ---------------------------------------------------------------------------
  // SAFETY-2
  // ---------------------------------------------------------------------------
  it("SAFETY-2: SafetyPort unsafe → SAFE_FALLBACK_MESSAGE (blocked_unsafe)", async () => {
    const aiPayload = "TEXTO_UNSAFE_QUE_NO_DEBE_EMITIRSE";

    const productionValidator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => UNSAFE_OUTPUT),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
      ],
      validator: productionValidator,
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("handover");
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // SAFETY-3
  // ---------------------------------------------------------------------------
  it("SAFETY-3: SafetyPort throws → fail-closed (port_unavailable + blocked_unsafe)", async () => {
    const aiPayload = "AI_TEXT_NEVER_LEAKED_ON_PORT_FAILURE";

    const productionValidator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => {
        throw new Error("provider unavailable");
      }),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
      ],
      validator: productionValidator,
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("handover");
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // SAFETY-4
  // ---------------------------------------------------------------------------
  it("SAFETY-4: SafetyPort timeout → fail-closed (port_unavailable + blocked_unsafe)", async () => {
    const aiPayload = "AI_TEXT_NEVER_LEAKED_ON_TIMEOUT";

    const productionValidator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(
        () => new Promise<SafetyPortOutput>(() => {}),
      ),
      safetyTimeoutMs: 50,
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
      ],
      validator: productionValidator,
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("handover");
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // SAFETY-5: kill-switch off (BasicAIValidator) NO desactiva el pipeline.
  // Con flujo válido, el texto IA se emite porque el placeholder isSafe=true
  // se mantiene y el resto del pipeline acepta.
  // ---------------------------------------------------------------------------
  it("SAFETY-5: SAFETY_PORT_ENABLED=false (BasicAIValidator) + flujo válido → emite texto IA", async () => {
    const aiPayload = "respuesta valida con kill switch off";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
      ],
      validator: new BasicAIValidator(),
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).toBe(aiPayload);
    expect(result.internalDiagnostics?.decisionAction).toBe("accept");
    expect(repositoryUpdateCalls()).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // SAFETY-6: kill-switch off NO es bypass del Validation Layer.
  // BasicAIValidator sigue evaluando isWithinFSM/isComplete/isGrounded/conf.
  // Si algo falla (aquí: low confidence), el HardGate sigue bloqueando.
  // ---------------------------------------------------------------------------
  it("SAFETY-6: SAFETY_PORT_ENABLED=false NO es bypass — low confidence sigue bloqueando", async () => {
    const aiPayload = "low_conf_payload";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.1,
      },
      ragDocuments: [
        { id: "doc-1", content: "context", score: 0.95 },
      ],
      validator: new BasicAIValidator(),
    });

    const result = await orchestrator.process(
      buildFSMContext({
        extractedData: { intent: "soporte" },
      }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("retry");
    expect(repositoryUpdateCalls()).toBe(0);
  });
});
