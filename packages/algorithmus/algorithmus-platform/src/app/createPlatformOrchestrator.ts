import { Orchestrator } from "@core/core/orchestrator/Orchestrator";
import { FSMEngine } from "@core/core/fsm/FSMEngine";
import { FSMTransitionChecker } from "@core/core/fsm/FSMTransitionChecker";
import { LLMGateway } from "@core/core/llm/LLMGateway";
import { RAGService } from "@core/core/rag/RAGService";
import { BasicAIValidator } from "@core/core/validation/AIValidatorImpl";
import { BasicDecisionMatrix } from "@core/core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "@core/core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "@core/core/validation/NoopMetricsPort";
import { LeadsRepository } from "@core/infra/postgres/LeadsRepository";

export function createPlatformOrchestrator(): Orchestrator {
  const fsmEngine = new FSMEngine();
  const llmGateway = new LLMGateway();
  const ragService = new RAGService({});

  return new Orchestrator({
    leadsRepository: new LeadsRepository(),
    fsmEngine,
    llmGateway,
    ragService,
    validator: new BasicAIValidator(),
    decisionMatrix: new BasicDecisionMatrix(),
    hardGate: new BasicHardGate(),
    fsmTransitionChecker: new FSMTransitionChecker(fsmEngine),
    validationMetrics: new NoopValidationMetricsPort(),
  });
}
