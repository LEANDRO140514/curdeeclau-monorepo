import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { FSMContext, FSMTransitionResult } from "../../core/fsm/fsm.types";
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
  DecisionMatrix,
} from "../../core/validation/AIValidationLayer";
import { BasicAIValidator } from "../../core/validation/AIValidatorImpl";
import { BasicDecisionMatrix } from "../../core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "../../core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "../../core/validation/NoopMetricsPort";

/**
 * Tests destructivos a nivel sistema del AI Validation Layer.
 *
 * Validan los 5 INVARIANTES del core ejecutando el `Orchestrator` real
 * con `BasicHardGate` y enforcement reales. Solo se mockean fronteras
 * externas (LLM, RAG, LeadsRepository). En los escenarios de "ataque" se inyecta
 * un `validator` y/o `decisionMatrix` y/o `transitionChecker` que intentan
 * FORZAR una emision IA invalida. El HardGate y el Orchestrator deben
 * ganar siempre.
 *
 * INVARIANTES (deben sostenerse siempre):
 *   1) Nunca se emite texto IA si validation.flags.isSafe       === false.
 *   2) Nunca se emite texto IA si validation.flags.isWithinFSM  === false.
 *   3) Nunca se emite texto IA si fsmTransition.allowed         === false.
 *   4) Nunca se emite texto IA si HardGate.allowed              === false.
 *   5) La unica condicion valida para emitir texto IA es:
 *      gate.allowed === true AND decision.action === "accept".
 *
 * Mensaje de fallback hardcodeado en `Orchestrator.ts`. NO se importa: si el
 * literal cambia en produccion sin actualizar este test, los tests deben
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

/**
 * Stub de LeadsRepository: `updateFsmState` no toca DB; cuenta invocaciones.
 */
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
  return {
    repo,
    updateCalls: () => updateCount,
  };
}

class StubTransitionChecker extends FSMTransitionChecker {
  private readonly stubResult: FSMTransitionResult;

  constructor(stubResult: FSMTransitionResult) {
    super(new FSMEngine());
    this.stubResult = stubResult;
  }

  check(): FSMTransitionResult {
    return this.stubResult;
  }
}

type BuildOpts = {
  llmResponse?: LLMResponse;
  ragDocuments?: RAGDocument[];
  validator?: AIValidator;
  decisionMatrix?: DecisionMatrix;
  transitionChecker?: FSMTransitionChecker;
};

function buildOrchestrator(opts: BuildOpts = {}): {
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
    validator: opts.validator ?? new BasicAIValidator(),
    decisionMatrix: opts.decisionMatrix ?? new BasicDecisionMatrix(),
    hardGate: new BasicHardGate(),
    fsmTransitionChecker:
      opts.transitionChecker ?? new FSMTransitionChecker(fsmEngine),
    validationMetrics: new NoopValidationMetricsPort(),
  });

  return {
    orchestrator,
    repositoryUpdateCalls: leadsStub.updateCalls,
  };
}

const ACCEPT_DECISION: DecisionMatrix = {
  decide: () => ({
    action: "accept",
    reasonCodes: ["validation_safe"],
  }),
};

// -----------------------------------------------------------------------------
// Suite
// -----------------------------------------------------------------------------

describe("AI Validation Layer — destructive system tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Empty AI response
  // ---------------------------------------------------------------------------
  it("1. empty AI response (text=\"\") → SAFE_FALLBACK_MESSAGE", async () => {
    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: "", provider: "ollama", latency_ms: 1 },
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.messageToSend).not.toBe("");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 2. Unsafe response (rompe INVARIANTE 1)
  //    validation.flags.isSafe = false + decision.action = "accept"
  //    El HardGate debe bloquear: el texto IA NUNCA debe filtrarse.
  // ---------------------------------------------------------------------------
  it("2. unsafe response with decision=accept (INVARIANTE 1) → AI text never leaks", async () => {
    const aiPayload = "I_AM_UNSAFE_PAYLOAD_THAT_MUST_NOT_LEAK";

    const unsafeValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: false,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["unsafe_content"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: unsafeValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 3. Fuera de FSM (INVARIANTE 2)
  //    validation.flags.isWithinFSM = false
  //    Aunque el resto sea seguro y la decision sea accept, el HardGate bloquea.
  // ---------------------------------------------------------------------------
  it("3. isWithinFSM=false with decision=accept (INVARIANTE 2) → SAFE_FALLBACK_MESSAGE", async () => {
    const aiPayload = "PAYLOAD_OUTSIDE_FSM_MUST_NOT_LEAK";

    const outsideFsmValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: false,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["outside_fsm"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: outsideFsmValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe(
      "blocked_outside_fsm",
    );
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 4. FSM transition invalida (INVARIANTE 3)
  //    fsmTransition.allowed = false + decision.action = "accept"
  //    El HardGate bloquea aunque las flags de validation sean todas true.
  // ---------------------------------------------------------------------------
  it("4. fsmTransition.allowed=false with decision=accept (INVARIANTE 3) → AI text never leaks", async () => {
    const aiPayload = "PAYLOAD_WITH_INVALID_TRANSITION_MUST_NOT_LEAK";

    const safeValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: [],
      }),
    };

    const blockedTransition = new StubTransitionChecker({
      allowed: false,
      fromState: "INIT",
      toState: "INIT",
      reasonCodes: ["transition_blocked"],
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: safeValidator,
      decisionMatrix: ACCEPT_DECISION,
      transitionChecker: blockedTransition,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe(
      "blocked_fsm_transition",
    );
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 5. No grounding
  //    groundingReferences = []  ->  validator real -> isGrounded=false
  //    DecisionMatrix real -> action="fallback" -> SAFE_FALLBACK_MESSAGE.
  //    Validator y DecisionMatrix REALES (sin stubs en este test).
  // ---------------------------------------------------------------------------
  it("5. no grounding (groundingReferences=[]) → decision=fallback → SAFE_FALLBACK_MESSAGE", async () => {
    const aiPayload = "answer with no grounding";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.internalDiagnostics?.decisionAction).toBe("fallback");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 6. Low confidence
  //    confidence < 0.5 con grounding presente -> DecisionMatrix=retry ->
  //    SAFE_FALLBACK_MESSAGE. Path RAG para que isGrounded=true (si no caeria
  //    en el caso 5 antes de evaluar confidence).
  // ---------------------------------------------------------------------------
  it("6. low confidence (<0.5) with grounding → decision=retry → SAFE_FALLBACK_MESSAGE", async () => {
    const aiPayload = "answer with low confidence";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.3,
      },
      ragDocuments: [
        { id: "doc-1", content: "context blob", score: 0.91 },
        { id: "doc-2", content: "other context", score: 0.85 },
      ],
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("retry");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 7. Ataque combinado (CRITICO)
  //    flags = { isSafe:false, isGrounded:false, isComplete:true, isWithinFSM:false }
  //    decision.action = "accept" (forzado)
  //    fsmTransition.allowed = true (real)
  //    => HardGate debe bloquear; ninguna combinacion de "trues parciales" puede
  //       compensar un isSafe/isWithinFSM=false.
  // ---------------------------------------------------------------------------
  it("7. combined attack (multiple flags=false + decision=accept) → AI text never leaks", async () => {
    const aiPayload = "EVIL_PAYLOAD_THAT_MUST_NEVER_LEAK";

    const evilValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: false,
          isGrounded: false,
          isComplete: true,
          isWithinFSM: false,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["unsafe_content", "ungrounded_output", "outside_fsm"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: evilValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    // El HardGate evalua isSafe primero -> blocked_unsafe es la razon emitida.
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 8. INVARIANTE GLOBAL (la regla del sistema)
  //
  //    Para TODA combinacion (isSafe, isWithinFSM, transition.allowed) ∈ {f,t}^3
  //    bajo decision.action="accept" forzado, debe sostenerse:
  //
  //        messageToSend === aiResponse.text
  //          AND
  //        (¬isSafe ∨ ¬isWithinFSM ∨ ¬transition.allowed ∨ ¬gate.allowed)
  //        =====>  SIEMPRE FALSE
  //
  //    Es decir: no existe estado donde el texto IA se haya emitido y al mismo
  //    tiempo alguna de las precondiciones criticas haya sido falsa.
  //
  //    Ademas: cuando todas las precondiciones son true (caso "happy"), el
  //    HardGate permite y el texto IA SI se emite (sanity check de que el
  //    invariante no esta trivialmente satisfecho por bloquear todo).
  // ---------------------------------------------------------------------------
  it("8. INVARIANTE GLOBAL — AI text leaks IFF (isSafe ∧ isWithinFSM ∧ transition.allowed ∧ gate.allowed)", async () => {
    const aiPayload = "INVARIANT_PAYLOAD";

    type Combo = {
      isSafe: boolean;
      isWithinFSM: boolean;
      transitionAllowed: boolean;
    };
    const combos: Combo[] = [];
    for (const isSafe of [false, true]) {
      for (const isWithinFSM of [false, true]) {
        for (const transitionAllowed of [false, true]) {
          combos.push({ isSafe, isWithinFSM, transitionAllowed });
        }
      }
    }
    expect(combos).toHaveLength(8);

    let happyPathLeaked = false;
    let blockedCount = 0;

    for (const c of combos) {
      const stubValidator: AIValidator = {
        validate: async () => ({
          flags: {
            isSafe: c.isSafe,
            isGrounded: true,
            isComplete: true,
            isWithinFSM: c.isWithinFSM,
          },
          scores: { confidence: 0.99 },
          reasonCodes: [],
        }),
      };

      const stubChecker = new StubTransitionChecker({
        allowed: c.transitionAllowed,
        fromState: "INIT",
        toState: "INIT",
        reasonCodes: c.transitionAllowed
          ? ["transition_allowed"]
          : ["transition_blocked"],
      });

      const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
        llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
        validator: stubValidator,
        decisionMatrix: ACCEPT_DECISION,
        transitionChecker: stubChecker,
      });

      const result = await orchestrator.process(buildFSMContext());

      const messageToSendIsAi = result.messageToSend === aiPayload;
      const gateAllowed =
        result.internalDiagnostics?.hardGateBlocked !== true;

      // -----------------------------------------------------------------------
      // Aserto literal del invariante (forma exacta solicitada):
      //
      // expect(
      //   messageToSend === aiResponse.text &&
      //   (
      //     !validation.flags.isSafe ||
      //     !validation.flags.isWithinFSM ||
      //     !fsmTransition.allowed ||
      //     !gate.allowed
      //   )
      // ).toBe(false);
      // -----------------------------------------------------------------------
      const anyConditionFalse =
        !c.isSafe ||
        !c.isWithinFSM ||
        !c.transitionAllowed ||
        !gateAllowed;
      expect(messageToSendIsAi && anyConditionFalse).toBe(false);

      // Sanity check: si todas las condiciones son true, el sistema DEBE
      // emitir el texto IA. Esto previene que el invariante se cumpla
      // trivialmente bloqueando todos los flujos.
      if (c.isSafe && c.isWithinFSM && c.transitionAllowed) {
        expect(gateAllowed).toBe(true);
        expect(result.messageToSend).toBe(aiPayload);
        happyPathLeaked = true;
      } else {
        expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
        expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
        // Cuando se bloquea, la transicion FSM tampoco se persiste.
        expect(repositoryUpdateCalls()).toBe(0);
        blockedCount += 1;
      }
    }

    // 1 caso "happy" (todo true) y 7 casos donde al menos una condicion es false.
    expect(happyPathLeaked).toBe(true);
    expect(blockedCount).toBe(7);
  });
});

// =============================================================================
// AI Validation - invariants enforcement (phase 1)
//
// Bloque adicional con naming alineado al ADR de Fase 1:
//
//   INV-1: !isSafe                                  -> no emite IA
//   INV-2: !isWithinFSM                             -> no emite IA
//   INV-3: !fsmTransition.allowed                   -> no emite IA
//   INV-4: !HardGate.allowed (decision.action invalida, ortogonal a 1-3)
//          -> no emite IA
//   INV-5: gate.allowed=true PERO decision.action !== "accept"
//          -> tampoco emite IA (regla 5: la unica condicion valida es
//             gate.allowed=true AND decision.action="accept").
//
//   CASE-1: aiResponse.text === ""                  -> fallback
//   CASE-2: groundingReferences === []              -> decision=fallback
//   CASE-3: confidence < threshold (0.5)            -> decision=retry
//   CASE-4: combined attack (varias flags=false)    -> fallback
//
//   GLOBAL: regla booleana sobre todas las combinaciones de
//           (isSafe, isWithinFSM, transition.allowed, gate.allowed).
//
// Reusa los helpers ya definidos al top del archivo:
//   - SAFE_FALLBACK_MESSAGE
//   - buildFSMContext, buildOrchestrator, makeLeadsRepositoryStub
//   - StubTransitionChecker
//   - ACCEPT_DECISION
// =============================================================================

describe("AI Validation – invariants enforcement (phase 1)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // INV-1
  // ---------------------------------------------------------------------------
  it("[INV-1] should not emit AI output when isSafe is false", async () => {
    const aiPayload = "INV1_PAYLOAD_MUST_NOT_LEAK";

    const unsafeValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: false,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["unsafe_content"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: unsafeValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // INV-2
  // ---------------------------------------------------------------------------
  it("[INV-2] should not emit AI output when isWithinFSM is false", async () => {
    const aiPayload = "INV2_PAYLOAD_MUST_NOT_LEAK";

    const outsideFsmValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: false,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["outside_fsm"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: outsideFsmValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe(
      "blocked_outside_fsm",
    );
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // INV-3
  // ---------------------------------------------------------------------------
  it("[INV-3] should not emit AI output when fsmTransition.allowed is false", async () => {
    const aiPayload = "INV3_PAYLOAD_MUST_NOT_LEAK";

    const safeValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: [],
      }),
    };

    const blockedTransition = new StubTransitionChecker({
      allowed: false,
      fromState: "INIT",
      toState: "INIT",
      reasonCodes: ["transition_blocked"],
    });

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: safeValidator,
      decisionMatrix: ACCEPT_DECISION,
      transitionChecker: blockedTransition,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe(
      "blocked_fsm_transition",
    );
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // INV-4
  //
  // gate.allowed=false por la unica via ortogonal a INV-1/2/3:
  // decision.action no esta en el conjunto valido. El HardGate retorna
  // `blocked_invalid_decision` y el Orchestrator NO emite el texto IA.
  // ---------------------------------------------------------------------------
  it("[INV-4] should not emit AI output when HardGate.allowed is false (invalid decision action)", async () => {
    const aiPayload = "INV4_PAYLOAD_MUST_NOT_LEAK";

    const allTrueValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: [],
      }),
    };

    // `as never` para insertar un valor fuera del union DecisionAction sin
    // tener que importar el tipo (requisito: no modificar imports).
    const invalidDecision: DecisionMatrix = {
      decide: () => ({
        action: "TOTALLY_INVALID_ACTION_FOR_HARDGATE" as never,
        reasonCodes: [],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: allTrueValidator,
      decisionMatrix: invalidDecision,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    expect(result.internalDiagnostics?.hardGateReason).toBe(
      "blocked_invalid_decision",
    );
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // INV-5
  //
  // Caso ortogonal a INV-1/2/3/4: el HardGate AUTORIZA (gate.allowed=true)
  // pero `decision.action !== "accept"`. La unica condicion valida para
  // emitir es la conjuncion. Aqui se viola la segunda parte: el Orchestrator
  // NO debe emitir el texto IA y NO debe persistir la transicion FSM.
  // ---------------------------------------------------------------------------
  it("[INV-5] should not emit AI output when decision.action !== \"accept\" (even with gate.allowed=true)", async () => {
    const aiPayload = "INV5_PAYLOAD_MUST_NOT_LEAK";

    const allTrueValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: true,
          isGrounded: true,
          isComplete: true,
          isWithinFSM: true,
        },
        scores: { confidence: 0.99 },
        reasonCodes: [],
      }),
    };

    const retryDecision: DecisionMatrix = {
      decide: () => ({
        action: "retry",
        reasonCodes: ["validation_risky", "retry_available"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: allTrueValidator,
      decisionMatrix: retryDecision,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("retry");
    // Aqui el HardGate AUTORIZA (gate.allowed=true). El bloqueo proviene de
    // la regla del Orchestrator: shouldPersist = gate.allowed && action==="accept".
    expect(result.internalDiagnostics?.hardGateBlocked).toBeFalsy();
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // CASE-1
  // ---------------------------------------------------------------------------
  it("[CASE-1] should fallback when AI response text is empty", async () => {
    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: "", provider: "ollama", latency_ms: 1 },
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.messageToSend).not.toBe("");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // CASE-2
  //
  // Path "reply" (sin intent="soporte") no inyecta groundingReferences.
  // Validator y DecisionMatrix REALES: isGrounded=false -> decision=fallback.
  // ---------------------------------------------------------------------------
  it("[CASE-2] should fallback when groundingReferences is empty", async () => {
    const aiPayload = "answer with no grounding";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.99,
      },
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("fallback");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // CASE-3
  //
  // Path RAG con docs (isGrounded=true) + confidence<0.5 -> decision=retry.
  // ---------------------------------------------------------------------------
  it("[CASE-3] should fallback when confidence is below threshold (<0.5)", async () => {
    const aiPayload = "answer with low confidence";

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: {
        text: aiPayload,
        provider: "ollama",
        latency_ms: 1,
        confidence: 0.3,
      },
      ragDocuments: [
        { id: "doc-1", content: "context blob", score: 0.91 },
        { id: "doc-2", content: "other context", score: 0.85 },
      ],
    });

    const result = await orchestrator.process(
      buildFSMContext({ extractedData: { intent: "soporte" } }),
    );

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.decisionAction).toBe("retry");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // CASE-4
  //
  // Ataque combinado: isSafe=false, isGrounded=false, isWithinFSM=false,
  // decision.action="accept" forzado. Ninguna conjuncion parcial de "trues"
  // puede compensar.
  // ---------------------------------------------------------------------------
  it("[CASE-4] should fallback under combined attack (multiple flags=false + decision=accept)", async () => {
    const aiPayload = "CASE4_EVIL_PAYLOAD_MUST_NOT_LEAK";

    const evilValidator: AIValidator = {
      validate: async () => ({
        flags: {
          isSafe: false,
          isGrounded: false,
          isComplete: true,
          isWithinFSM: false,
        },
        scores: { confidence: 0.99 },
        reasonCodes: ["unsafe_content", "ungrounded_output", "outside_fsm"],
      }),
    };

    const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
      llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
      validator: evilValidator,
      decisionMatrix: ACCEPT_DECISION,
    });

    const result = await orchestrator.process(buildFSMContext());

    expect(result.messageToSend).not.toBe(aiPayload);
    expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
    expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
    // El HardGate evalua isSafe primero -> blocked_unsafe es la razon emitida.
    expect(result.internalDiagnostics?.hardGateReason).toBe("blocked_unsafe");
    expect(repositoryUpdateCalls()).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // GLOBAL
  //
  // Para TODA combinacion (isSafe, isWithinFSM, transition.allowed) ∈ {f,t}^3
  // bajo decision.action="accept" forzado:
  //
  //   messageToSend === aiResponse.text
  //     AND
  //   (¬isSafe ∨ ¬isWithinFSM ∨ ¬transition.allowed ∨ ¬gate.allowed)
  //   =====>  SIEMPRE FALSE
  //
  // Sanity: cuando todas las precondiciones son true, el sistema DEBE emitir
  // el texto IA (evita que el invariante se cumpla trivialmente bloqueando
  // todos los flujos).
  // ---------------------------------------------------------------------------
  it("[GLOBAL] should preserve global invariant: AI text leaks IFF (isSafe ∧ isWithinFSM ∧ transition.allowed ∧ gate.allowed)", async () => {
    const aiPayload = "GLOBAL_INVARIANT_PAYLOAD";

    type Combo = {
      isSafe: boolean;
      isWithinFSM: boolean;
      transitionAllowed: boolean;
    };
    const combos: Combo[] = [];
    for (const isSafe of [false, true]) {
      for (const isWithinFSM of [false, true]) {
        for (const transitionAllowed of [false, true]) {
          combos.push({ isSafe, isWithinFSM, transitionAllowed });
        }
      }
    }
    expect(combos).toHaveLength(8);

    let happyPathLeaked = false;
    let blockedCount = 0;

    for (const c of combos) {
      const stubValidator: AIValidator = {
        validate: async () => ({
          flags: {
            isSafe: c.isSafe,
            isGrounded: true,
            isComplete: true,
            isWithinFSM: c.isWithinFSM,
          },
          scores: { confidence: 0.99 },
          reasonCodes: [],
        }),
      };

      const stubChecker = new StubTransitionChecker({
        allowed: c.transitionAllowed,
        fromState: "INIT",
        toState: "INIT",
        reasonCodes: c.transitionAllowed
          ? ["transition_allowed"]
          : ["transition_blocked"],
      });

      const { orchestrator, repositoryUpdateCalls } = buildOrchestrator({
        llmResponse: { text: aiPayload, provider: "ollama", latency_ms: 1 },
        validator: stubValidator,
        decisionMatrix: ACCEPT_DECISION,
        transitionChecker: stubChecker,
      });

      const result = await orchestrator.process(buildFSMContext());

      const messageToSendIsAi = result.messageToSend === aiPayload;
      const gateAllowed =
        result.internalDiagnostics?.hardGateBlocked !== true;

      // Aserto literal del invariante (forma exacta del enunciado):
      //
      // expect(
      //   messageToSend === aiResponse.text &&
      //   (
      //     !validation.flags.isSafe ||
      //     !validation.flags.isWithinFSM ||
      //     !fsmTransition.allowed ||
      //     !gate.allowed
      //   )
      // ).toBe(false);
      const anyConditionFalse =
        !c.isSafe ||
        !c.isWithinFSM ||
        !c.transitionAllowed ||
        !gateAllowed;
      expect(messageToSendIsAi && anyConditionFalse).toBe(false);

      if (c.isSafe && c.isWithinFSM && c.transitionAllowed) {
        expect(gateAllowed).toBe(true);
        expect(result.messageToSend).toBe(aiPayload);
        happyPathLeaked = true;
      } else {
        expect(result.messageToSend).toBe(SAFE_FALLBACK_MESSAGE);
        expect(result.internalDiagnostics?.hardGateBlocked).toBe(true);
        expect(repositoryUpdateCalls()).toBe(0);
        blockedCount += 1;
      }
    }

    expect(happyPathLeaked).toBe(true);
    expect(blockedCount).toBe(7);
  });
});
