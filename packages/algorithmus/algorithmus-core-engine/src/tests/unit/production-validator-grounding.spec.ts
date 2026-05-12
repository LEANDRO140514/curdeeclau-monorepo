import { describe, expect, it, jest } from "@jest/globals";
import { getAllowedActionsForState } from "../../core/fsm/fsm.types";
import type {
  GroundingPort,
  GroundingPortInput,
  GroundingPortOutput,
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
  ValidationContext,
} from "../../core/validation/AIValidationLayer";
import { ProductionAIValidator } from "../../core/validation/ProductionAIValidator";

/**
 * Tests unitarios PSV-G del `ProductionAIValidator` enfocados en la
 * composicion del `GroundingPort` (Lexical Grounding v1).
 *
 * NO tocan Orchestrator, FSM ni infra real. Solo ejercitan la matriz de
 * decisiones del validator:
 *
 *   - port grounded               -> isGrounded=true.
 *   - port ungrounded             -> isGrounded=false + ungrounded_output.
 *   - port throws                 -> fail-closed: isGrounded=false + port_unavailable.
 *   - port timeout                -> fail-closed: isGrounded=false + port_unavailable.
 *   - referencias vacias          -> ungrounded_output (NO port_unavailable, sin llamar al port).
 *   - groundingPort no inyectado  -> preserva base (heuristica length>0).
 */

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
    private readonly impl: (input: GroundingPortInput) => Promise<GroundingPortOutput>,
  ) {}
  evaluate(input: GroundingPortInput): Promise<GroundingPortOutput> {
    return this.impl(input);
  }
}

function buildContext(
  overrides: Partial<ValidationContext> = {},
): ValidationContext {
  return {
    tenantId: "tenant-test",
    leadId: "lead-test",
    traceId: "trace-test",
    task: "rag_answer",
    expectedAction: "rag_answer",
    userMessage: "que botas tienen plantilla anatomica?",
    aiOutput: {
      text: "Las botas Prima Donna tienen plantilla anatomica.",
      confidence: 0.9,
    },
    groundingReferences: [
      {
        id: "doc-1",
        source: "rag",
        excerpt:
          "Las botas Prima Donna incorporan plantilla anatomica de espuma viscoelastica.",
      },
    ],
    fsmContext: {
      leadId: "lead-test",
      tenantId: "tenant-test",
      currentState: "SUPPORT_RAG",
      message: "que botas tienen plantilla anatomica?",
      allowedActions: getAllowedActionsForState("SUPPORT_RAG"),
    },
    ...overrides,
  };
}

describe("ProductionAIValidator + GroundingPort (unit, PSV-G)", () => {
  it("PSV-G1: GroundingPort grounded -> flags.isGrounded=true, sin ungrounded_output", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(async () => ({
        isGrounded: true,
        confidence: 0.85,
        reasonCodes: [],
        referenceIds: ["doc-1"],
      })),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isGrounded).toBe(true);
    expect(result.reasonCodes).not.toContain("ungrounded_output");
    expect(result.reasonCodes).not.toContain("port_unavailable");
    expect(result.metadata?.groundingReferenceIds).toEqual(["doc-1"]);
  });

  it("PSV-G2: GroundingPort ungrounded -> flags.isGrounded=false + ungrounded_output", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(async () => ({
        isGrounded: false,
        confidence: 0.05,
        reasonCodes: ["ungrounded_output"],
        referenceIds: ["doc-1"],
      })),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isGrounded).toBe(false);
    expect(result.reasonCodes).toContain("ungrounded_output");
    expect(result.reasonCodes).not.toContain("port_unavailable");
  });

  it("PSV-G3: GroundingPort throws -> fail-closed (isGrounded=false + port_unavailable)", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(async () => {
        throw new Error("grounding boom");
      }),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isGrounded).toBe(false);
    expect(result.reasonCodes).toContain("port_unavailable");
    expect(result.reasonCodes).not.toContain("ungrounded_output");
  });

  it("PSV-G4: GroundingPort timeout -> fail-closed (isGrounded=false + port_unavailable)", async () => {
    const neverResolving = new StubGroundingPort(
      () => new Promise<GroundingPortOutput>(() => {}),
    );
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: neverResolving,
      groundingTimeoutMs: 50,
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isGrounded).toBe(false);
    expect(result.reasonCodes).toContain("port_unavailable");
  });

  it("PSV-G5: referencias vacias -> ungrounded_output (NO port_unavailable, NO se llama port)", async () => {
    const spy = jest.fn(async () => ({
      isGrounded: true,
      confidence: 1,
      reasonCodes: [],
    })) as unknown as (input: GroundingPortInput) => Promise<GroundingPortOutput>;

    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
      groundingPort: new StubGroundingPort(spy),
    });

    const result = await validator.validate(
      buildContext({ groundingReferences: [] }),
    );

    expect(result.flags.isGrounded).toBe(false);
    expect(result.reasonCodes).toContain("ungrounded_output");
    expect(result.reasonCodes).not.toContain("port_unavailable");
    expect(spy).not.toHaveBeenCalled();
  });

  it("PSV-G6: groundingPort no inyectado -> preserva base (heuristica length>0)", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isGrounded).toBe(true);
    expect(result.reasonCodes).not.toContain("port_unavailable");
  });
});
