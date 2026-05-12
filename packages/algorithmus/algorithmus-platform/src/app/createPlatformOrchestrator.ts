import { Orchestrator } from "@core/core/orchestrator/Orchestrator";
import { FSMEngine } from "@core/core/fsm/FSMEngine";
import { FSMTransitionChecker } from "@core/core/fsm/FSMTransitionChecker";
import { LLMGateway } from "@core/core/llm/LLMGateway";
import { RAGService } from "@core/core/rag/RAGService";
import { BasicAIValidator } from "@core/core/validation/AIValidatorImpl";
import { BasicDecisionMatrix } from "@core/core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "@core/core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "@core/core/validation/NoopMetricsPort";
import type {
  LeadRecord,
  UpdateFsmStateInput,
} from "@core/infra/postgres/LeadsRepository";
import { LeadsRepository } from "@core/infra/postgres/LeadsRepository";

function platformStubLeadRecord(): LeadRecord {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-0000-0000-000000000001",
    tenant_id: "00000000-0000-0000-0000-000000000002",
    phone_number: "+0000000000",
    first_name: null,
    email: null,
    tags: {},
    fsm_state: "INIT",
    ai_confidence_score: 0,
    last_interaction: null,
    created_at: now,
    updated_at: now,
  };
}

function createLeadsRepositoryStub(): LeadsRepository {
  return {
    async updateFsmState(
      _input: UpdateFsmStateInput,
    ): Promise<LeadRecord> {
      return platformStubLeadRecord();
    },
  } as unknown as LeadsRepository;
}

export function createPlatformOrchestrator(): Orchestrator {
  const fsmEngine = new FSMEngine();
  const llmGateway = new LLMGateway();
  const ragService = new RAGService({});

  return new Orchestrator({
    leadsRepository: createLeadsRepositoryStub(),
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
