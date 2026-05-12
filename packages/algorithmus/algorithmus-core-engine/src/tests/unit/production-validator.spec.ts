import { describe, expect, it, jest } from "@jest/globals";
import { getAllowedActionsForState } from "../../core/fsm/fsm.types";
import type {
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
  ValidationContext,
} from "../../core/validation/AIValidationLayer";
import { ProductionAIValidator } from "../../core/validation/ProductionAIValidator";

/**
 * Tests unitarios de `ProductionAIValidator`. NO tocan Orchestrator, FSM ni infra.
 * Solo ejercitan la composicion `BasicAIValidator + SafetyPort` y la policy
 * fail-closed del validator.
 */

function buildContext(
  overrides: Partial<ValidationContext> = {},
): ValidationContext {
  return {
    tenantId: "tenant-test",
    leadId: "lead-test",
    traceId: "trace-test",
    task: "rag_answer",
    expectedAction: "rag_answer",
    userMessage: "hola",
    aiOutput: { text: "respuesta valida", confidence: 0.9 },
    groundingReferences: [{ id: "doc-1", source: "rag" }],
    fsmContext: {
      leadId: "lead-test",
      tenantId: "tenant-test",
      currentState: "SUPPORT_RAG",
      message: "hola",
      allowedActions: getAllowedActionsForState("SUPPORT_RAG"),
    },
    ...overrides,
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
  labels: ["hate", "harassment"],
};

class StubSafetyPort implements SafetyPort {
  constructor(
    private readonly impl: (input: SafetyPortInput) => Promise<SafetyPortOutput>,
  ) {}
  evaluate(input: SafetyPortInput): Promise<SafetyPortOutput> {
    return this.impl(input);
  }
}

describe("ProductionAIValidator (unit)", () => {
  // ---------------------------------------------------------------------------
  // PSV-1
  // ---------------------------------------------------------------------------
  it("PSV-1: SafetyPort safe → flags.isSafe=true, no port_unavailable", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => SAFE_OUTPUT),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isSafe).toBe(true);
    expect(result.reasonCodes).not.toContain("unsafe_content");
    expect(result.reasonCodes).not.toContain("port_unavailable");
    expect(result.metadata?.validatorName).toBe("ProductionAIValidator");
  });

  // ---------------------------------------------------------------------------
  // PSV-2
  // ---------------------------------------------------------------------------
  it("PSV-2: SafetyPort unsafe → flags.isSafe=false, reasonCode unsafe_content, labels preservados", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => UNSAFE_OUTPUT),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isSafe).toBe(false);
    expect(result.reasonCodes).toContain("unsafe_content");
    expect(result.metadata?.safetyLabels).toEqual(["hate", "harassment"]);
  });

  // ---------------------------------------------------------------------------
  // PSV-3
  // ---------------------------------------------------------------------------
  it("PSV-3: SafetyPort throws → fail-closed (isSafe=false + port_unavailable)", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => {
        throw new Error("provider boom");
      }),
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isSafe).toBe(false);
    expect(result.reasonCodes).toContain("port_unavailable");
    expect(result.reasonCodes).not.toContain("unsafe_content");
  });

  // ---------------------------------------------------------------------------
  // PSV-4
  // ---------------------------------------------------------------------------
  it("PSV-4: SafetyPort timeout → fail-closed (isSafe=false + port_unavailable)", async () => {
    const neverResolving = new StubSafetyPort(
      () => new Promise<SafetyPortOutput>(() => {}),
    );

    const validator = new ProductionAIValidator({
      safetyPort: neverResolving,
      safetyTimeoutMs: 50,
    });

    const result = await validator.validate(buildContext());

    expect(result.flags.isSafe).toBe(false);
    expect(result.reasonCodes).toContain("port_unavailable");
  });

  // ---------------------------------------------------------------------------
  // PSV-5
  // ---------------------------------------------------------------------------
  it("PSV-5: base flags se preservan (incomplete_output sigue presente con SafetyPort safe)", async () => {
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(async () => SAFE_OUTPUT),
    });

    const result = await validator.validate(
      buildContext({
        aiOutput: { text: "   ", confidence: 0.9 },
      }),
    );

    expect(result.flags.isSafe).toBe(true);
    expect(result.flags.isComplete).toBe(false);
    expect(result.reasonCodes).toContain("incomplete_output");
  });

  // ---------------------------------------------------------------------------
  // PSV-6: el validator pasa userMessage + aiOutputText al SafetyPort
  // ---------------------------------------------------------------------------
  it("PSV-6: SafetyPort recibe tenantId, traceId, userMessage y aiOutputText", async () => {
    const spy = jest.fn(async () => SAFE_OUTPUT);
    const validator = new ProductionAIValidator({
      safetyPort: new StubSafetyPort(spy as never),
    });

    await validator.validate(
      buildContext({
        userMessage: "user-side",
        aiOutput: { text: "ai-side", confidence: 0.9 },
      }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      tenantId: "tenant-test",
      traceId: "trace-test",
      userMessage: "user-side",
      aiOutputText: "ai-side",
    });
  });
});
