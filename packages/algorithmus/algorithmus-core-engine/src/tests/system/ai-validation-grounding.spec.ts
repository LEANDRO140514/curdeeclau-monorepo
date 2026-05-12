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
  GroundingPort,
  GroundingPortInput,
  GroundingPortOutput,
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
} from "../../core/validation/AIValidationLayer";
import { BasicDecisionMatrix } from "../../core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "../../core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "../../core/validation/NoopMetricsPort";
import { ProductionAIValidator } from "../../core/validation/ProductionAIValidator";
import { LexicalGroundingClient } from "../../infra/grounding/LexicalGroundingClient";
import { LexicalGroundingPort } from "../../infra/grounding/LexicalGroundingPort";

/**
 * Tests destructivos a nivel sistema del GroundingPort (Lexical Grounding v1)
 * + ProductionAIValidator + Orchestrator + BasicDecisionMatrix + BasicHardGate.
 *
 * Reglas del juego:
 *   - Orchestrator real con FSMEngine, FSMTransitionChecker, BasicDecisionMatrix
 *     y BasicHardGate reales.
 *   - Validator es ProductionAIValidator real con SafetyPort safe-stub y
 *     GroundingPort variable (real lexical o stub destructivo).
 *   - Invariante critica: si el output es ungrounded o el GroundingPort falla,
 *     el HardGate/DecisionMatrix bloquea la transicion FSM y NO debe haber
 *     UPDATE en `leads` via LeadsRepository.
 *
 * Mensaje de fallback hardcodeado en `Orchestrator.ts`. Si el literal cambia
 * en produccion sin actualizar este test, los tests deben fallar.
 */
const SAFE_FALLBACK_MESSAGE = "Hubo un problema, intenta nuevamente.";

function buildFSMContext(overrides: Partial<FSMContext> = {}): FSMContext {
  return {
    leadId: "lead-test",
    tenantId: "tenant-test",
    currentState: "INIT",
    message: "que botas prima donna tienen plantilla anatomica?",
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

const SAFE_OUTPUT: SafetyPortOutput = {
  isSafe: true,
  reasonCodes: [],
  labels: [],
};

class StubSafetyPort implements SafetyPort {
  evaluate(_input: SafetyPortInput): Promise<SafetyPortOutput> {
    return Promise.resolve(SAFE_OUTPUT);
  }
}

class StubGroundingPort implements GroundingPort {
  constructor(
    private readonly impl: (
      input: GroundingPortInput,
    ) => Promise<GroundingPortOutput>,
  ) {}
  evaluate(input: GroundingPortInput): Promise<GroundingPortOutput> {
    return this.impl(input);
  }
}

type BuildOpts = {
  llmResponse: LLMResponse;
  ragDocuments: RAGDocument[];
  validator: AIValidator;
};

function buildOrchestrator(opts: BuildOpts): {
  orchestrator: Orchestrator;
  repositoryUpdateCalls: () => number;
} {
  const fsmEngine = new FSMEngine();
  const llm = new LLMGateway();
  const rag = new RAGService({});

  jest.spyOn(llm, "generate").mockResolvedValue(opts.llmResponse);
  jest.spyOn(rag, "query").mockResolvedValue({
    documents: opts.ragDocuments,
    usedTopK: opts.ragDocuments.length || 5,
  });

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

describe("GroundingPort (Lexical v1) — destructive system tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // GROUND-1
  // ---------------------------------------------------------------------------
  it("GROUND-1: output con alto overlap lexico + LexicalGroundingPort real -> accept y emite texto IA", async () => {
    const groundedAiText =
      "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante para uso prolongado.";

    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new LexicalGroundingPort({
        client: new LexicalGroundingClient({ minOutputChars: 10 }),
        minConfidence: 0.3,
      }),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: groundedAiText,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.95,
      },
      ragDocuments: [
        {
          id: "doc-1",
          content:
            "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante y son ideales para uso prolongado en consultorios.",
          score: 0.95,
        },
      ],
      validator,
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).toBe(groundedAiText);
    expect(result.internalDiagnostics?.decisionAction).toBe("accept");
    expect(result.internalDiagnostics?.hardGateBlocked).toBeFalsy();
    expect(repositoryUpdateCalls()).toBe(1); // INIT -> SUPPORT_RAG
  });

  // ---------------------------------------------------------------------------
  // GROUND-2
  // ---------------------------------------------------------------------------
  it("GROUND-2: output con vocabulario disjunto + LexicalGroundingPort real -> fallback + cero UPDATE", async () => {
    const ungroundedAiText =
      "Recuerda agendar reservaciones turisticas internacionales mediante nuestra plataforma online global.";

    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new LexicalGroundingPort({
        client: new LexicalGroundingClient({ minOutputChars: 10 }),
        minConfidence: 0.3,
      }),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: ungroundedAiText,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.95,
      },
      ragDocuments: [
        {
          id: "doc-1",
          content:
            "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante.",
          score: 0.95,
        },
      ],
      validator,
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).not.toBe(ungroundedAiText);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("fallback");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // GROUND-3
  // ---------------------------------------------------------------------------
  it("GROUND-3: GroundingPort throws -> fail-closed (fallback + cero UPDATE)", async () => {
    const aiPayload =
      "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante.";

    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(async () => {
        throw new Error("grounding adapter unavailable");
      }),
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.95,
      },
      ragDocuments: [
        {
          id: "doc-1",
          content:
            "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante.",
          score: 0.95,
        },
      ],
      validator,
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("fallback");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // GROUND-4
  // ---------------------------------------------------------------------------
  it("GROUND-4: GroundingPort timeout -> fail-closed (fallback + cero UPDATE)", async () => {
    const aiPayload =
      "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante.";

    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(
        () => new Promise<GroundingPortOutput>(() => {}),
      ),
      groundingTimeoutMs: 50,
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.95,
      },
      ragDocuments: [
        {
          id: "doc-1",
          content:
            "Las botas Prima Donna tienen plantilla anatomica con suela antideslizante.",
          score: 0.95,
        },
      ],
      validator,
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("fallback");
    expect(repositoryUpdateCalls()).toBe(0);
  });
});
