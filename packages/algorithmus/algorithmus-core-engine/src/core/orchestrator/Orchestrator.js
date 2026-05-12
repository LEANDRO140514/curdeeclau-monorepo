"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const pino_1 = __importDefault(require("pino"));
const Metrics_1 = require("../observability/Metrics");
const fsm_types_1 = require("../fsm/fsm.types");
const FSMTransitionChecker_1 = require("../fsm/FSMTransitionChecker");
const LeadsRepository_1 = require("../../infra/postgres/LeadsRepository");
const AIValidatorImpl_1 = require("../validation/AIValidatorImpl");
const DecisionMatrixImpl_1 = require("../validation/DecisionMatrixImpl");
const HardGateImpl_1 = require("../validation/HardGateImpl");
const NoopMetricsPort_1 = require("../validation/NoopMetricsPort");
const RAG_CONTEXT_MAX_CHARS = 2000;
const RAG_DOCUMENT_MAX_CHARS = 500;
/** Default topK RAG; override opcional `ORCHESTRATOR_RAG_TOP_K` (1–50). */
const DEFAULT_RAG_TOP_K = 5;
const envRagTopK = process.env.ORCHESTRATOR_RAG_TOP_K?.trim();
const parsedTopK = envRagTopK
    ? Number.parseInt(envRagTopK, 10)
    : Number.NaN;
const RAG_TOP_K = Number.isFinite(parsedTopK) &&
    parsedTopK > 0 &&
    parsedTopK <= 50
    ? parsedTopK
    : DEFAULT_RAG_TOP_K;
const SAFE_FALLBACK_MESSAGE = "Hubo un problema, intenta nuevamente.";
const DEFAULT_AI_MESSAGE = "Procesando tu solicitud...";
const defaultLog = (0, pino_1.default)({
    level: process.env.LOG_LEVEL ?? "info",
    name: "algorithmus-orchestrator",
});
function isCanonicalOrchestratorDeps(x) {
    if (x === null || typeof x !== "object") {
        return false;
    }
    const o = x;
    return ("fsmEngine" in o &&
        "llmGateway" in o &&
        "ragService" in o &&
        "leadsRepository" in o &&
        o.leadsRepository != null &&
        typeof o.leadsRepository === "object" &&
        o.fsmEngine != null &&
        o.llmGateway != null &&
        o.ragService != null);
}
function internalDiagnosticsNonEmpty(d) {
    if (d.persistError !== undefined && d.persistError !== "") {
        return true;
    }
    if (d.llmFailureReason !== undefined && d.llmFailureReason !== "") {
        return true;
    }
    if (d.ragFailure !== undefined) {
        return true;
    }
    if (d.hardGateBlocked === true) {
        return true;
    }
    if (d.hardGateReason !== undefined) {
        return true;
    }
    if (d.decisionAction !== undefined) {
        return true;
    }
    return false;
}
function isLegacyOrchestratorObjectDeps(x) {
    if (x === null || typeof x !== "object") {
        return false;
    }
    const o = x;
    return ("fsm" in o &&
        "llm" in o &&
        "rag" in o &&
        !("fsmEngine" in o) &&
        o.fsm != null &&
        o.llm != null &&
        o.rag != null);
}
/**
 * Orquesta FSM + LLM + AI Validation Layer.
 *
 * Garantías:
 *   - Toda salida IA pasa por HardGate (no hay path alterno).
 *   - El validator solo evalúa; la DecisionMatrix decide; el FSM autoriza la
 *     transición; el HardGate bloquea la salida final.
 *   - Si la salida no es autorizada se emite un mensaje de fallback seguro y
 *     no se transiciona el estado FSM.
 */
class Orchestrator {
    fsm;
    llm;
    rag;
    log;
    leadsRepository;
    metrics;
    validator;
    decisionMatrix;
    hardGate;
    transitionChecker;
    validationMetrics;
    constructor(arg1, arg2, arg3, arg4) {
        if (isCanonicalOrchestratorDeps(arg1)) {
            this.fsm = arg1.fsmEngine;
            this.llm = arg1.llmGateway;
            this.rag = arg1.ragService;
            this.log = arg1.logger ?? defaultLog;
            this.leadsRepository = arg1.leadsRepository;
            this.metrics = arg1.metrics ?? new Metrics_1.NoopMetrics();
            this.validator = arg1.validator ?? new AIValidatorImpl_1.BasicAIValidator();
            this.decisionMatrix = arg1.decisionMatrix ?? new DecisionMatrixImpl_1.BasicDecisionMatrix();
            this.hardGate = arg1.hardGate ?? new HardGateImpl_1.BasicHardGate();
            this.transitionChecker =
                arg1.fsmTransitionChecker ?? new FSMTransitionChecker_1.FSMTransitionChecker(this.fsm);
            this.validationMetrics =
                arg1.validationMetrics ?? new NoopMetricsPort_1.NoopValidationMetricsPort();
        }
        else if (isLegacyOrchestratorObjectDeps(arg1)) {
            this.fsm = arg1.fsm;
            this.llm = arg1.llm;
            this.rag = arg1.rag;
            this.log = arg1.logger ?? defaultLog;
            this.leadsRepository = new LeadsRepository_1.LeadsRepository();
            this.metrics = new Metrics_1.NoopMetrics();
            this.validator = new AIValidatorImpl_1.BasicAIValidator();
            this.decisionMatrix = new DecisionMatrixImpl_1.BasicDecisionMatrix();
            this.hardGate = new HardGateImpl_1.BasicHardGate();
            this.transitionChecker = new FSMTransitionChecker_1.FSMTransitionChecker(this.fsm);
            this.validationMetrics = new NoopMetricsPort_1.NoopValidationMetricsPort();
            this.log.warn({
                event: "deprecated_constructor_usage",
                service: "Orchestrator",
                mode: "legacy",
                variant: "object_fsm_llm_rag",
            }, "usar OrchestratorDeps con leadsRepository, fsmEngine, llmGateway, ragService");
        }
        else {
            this.fsm = arg1;
            this.llm = arg2;
            this.rag = arg3;
            this.log = arg4 ?? defaultLog;
            this.leadsRepository = new LeadsRepository_1.LeadsRepository();
            this.metrics = new Metrics_1.NoopMetrics();
            this.validator = new AIValidatorImpl_1.BasicAIValidator();
            this.decisionMatrix = new DecisionMatrixImpl_1.BasicDecisionMatrix();
            this.hardGate = new HardGateImpl_1.BasicHardGate();
            this.transitionChecker = new FSMTransitionChecker_1.FSMTransitionChecker(this.fsm);
            this.validationMetrics = new NoopMetricsPort_1.NoopValidationMetricsPort();
            this.log.warn({
                event: "deprecated_constructor_usage",
                service: "Orchestrator",
                mode: "legacy",
                variant: "positional",
            }, "usar OrchestratorDeps con leadsRepository, fsmEngine, llmGateway, ragService");
        }
    }
    async process(context) {
        const log = this.log.child({
            module: "Orchestrator",
            trace_id: context.traceId,
            tenant_id: context.tenantId,
            lead_id: context.leadId,
        });
        const initial = this.fsm.evaluate(context);
        log.info({
            step: "fsm_initial",
            currentState: context.currentState,
            action: initial.action,
        }, "fsm initial");
        switch (initial.action) {
            case "classify_intent": {
                const gen = await this.invokeLlm("classify_intent", context, log);
                if (!gen.ok) {
                    const final = initial;
                    return this.finalizeWithPersist(context, final, log, {
                        initial,
                        final,
                        messageToSend: SAFE_FALLBACK_MESSAGE,
                        internalDiagnostics: {
                            llmFailureReason: gen.errorDetail,
                        },
                    });
                }
                const { llmResponse } = gen;
                const extractedData = this.mergeClassify(context, llmResponse);
                const piped = await this.runValidationPipeline({
                    llmResponse,
                    initial,
                    context,
                    extractedData,
                    task: "classify_intent",
                    references: [],
                    log,
                });
                log.info({ step: "fsm_final", nextState: piped.final.nextState }, "fsm final");
                return this.finalizeWithPersist(context, piped.final, log, {
                    initial,
                    final: piped.final,
                    llmResponse,
                    messageToSend: piped.messageToSend,
                    internalDiagnostics: piped.diagnostics,
                    shouldPersist: piped.shouldPersist,
                });
            }
            case "extract_slots": {
                const gen = await this.invokeLlm("extract_slots", context, log);
                if (!gen.ok) {
                    const final = initial;
                    return this.finalizeWithPersist(context, final, log, {
                        initial,
                        final,
                        messageToSend: SAFE_FALLBACK_MESSAGE,
                        internalDiagnostics: {
                            llmFailureReason: gen.errorDetail,
                        },
                    });
                }
                const { llmResponse } = gen;
                const extractedData = this.mergeExtractSlots(context, llmResponse);
                const piped = await this.runValidationPipeline({
                    llmResponse,
                    initial,
                    context,
                    extractedData,
                    task: "extract_slots",
                    references: [],
                    log,
                });
                log.info({ step: "fsm_final", nextState: piped.final.nextState }, "fsm final");
                return this.finalizeWithPersist(context, piped.final, log, {
                    initial,
                    final: piped.final,
                    llmResponse,
                    messageToSend: piped.messageToSend,
                    internalDiagnostics: piped.diagnostics,
                    shouldPersist: piped.shouldPersist,
                });
            }
            case "query_rag": {
                let ragResult;
                let ragQueryErrorDetail;
                try {
                    ragResult = await this.rag.query({
                        tenantId: context.tenantId,
                        query: context.message,
                        topK: RAG_TOP_K,
                    });
                }
                catch (ragErr) {
                    const detail = ragErr instanceof Error ? ragErr.message : String(ragErr);
                    ragQueryErrorDetail = detail;
                    log.error({
                        step: "rag_error",
                        error: detail,
                        rag_top_k: RAG_TOP_K,
                    }, "rag retrieval error");
                    ragResult = { documents: [], usedTopK: RAG_TOP_K };
                }
                if (ragResult.documents.length === 0) {
                    log.warn({ step: "rag_no_docs" }, "rag sin documentos");
                    log.info({
                        step: "rag_context_built",
                        docCount: 0,
                        contextLength: 0,
                    }, "rag context built");
                    const final = initial;
                    return this.finalizeWithPersist(context, final, log, {
                        initial,
                        final,
                        messageToSend: "No encontré información relevante, ¿puedes dar más detalles?",
                        internalDiagnostics: {
                            ragFailure: ragQueryErrorDetail
                                ? { type: "retrieval_failed", detail: ragQueryErrorDetail }
                                : { type: "no_documents" },
                        },
                    });
                }
                const docsOrdered = [...ragResult.documents].sort((a, b) => b.score - a.score);
                const contextText = docsOrdered
                    .map((doc, i) => {
                    const body = doc.content
                        .replace(/```[\s\S]*?```/g, "")
                        .trim()
                        .slice(0, RAG_DOCUMENT_MAX_CHARS);
                    return `Documento ${i + 1}:\n${body}`;
                })
                    .join("\n\n");
                const safeContextText = contextText.slice(0, RAG_CONTEXT_MAX_CHARS);
                log.info({
                    step: "rag_context_built",
                    docCount: ragResult.documents.length,
                    contextLength: safeContextText.length,
                }, "rag context built");
                const ragPrompt = `
Responde únicamente usando el contexto proporcionado debajo.
Si la información no es suficiente para responder con certeza, responde exactamente: "No tengo suficiente información para responder con certeza."
No inventes información ni uses conocimiento que no aparezca en el contexto.

Contexto:
${safeContextText}

Pregunta del usuario:
${context.message}
`.trim();
                const gen = await this.invokeLlm("rag_answer", context, log, {
                    input: ragPrompt,
                });
                if (!gen.ok) {
                    const final = initial;
                    return this.finalizeWithPersist(context, final, log, {
                        initial,
                        final,
                        messageToSend: SAFE_FALLBACK_MESSAGE,
                        internalDiagnostics: {
                            llmFailureReason: gen.errorDetail,
                        },
                    });
                }
                const { llmResponse } = gen;
                const newData = {
                    ragAttempts: (context.extractedData?.ragAttempts ?? 0) + 1,
                    ragConfidence: llmResponse?.confidence,
                };
                const extractedData = {
                    ...context.extractedData,
                    ...newData,
                };
                const references = docsOrdered.map((doc) => ({
                    id: doc.id,
                    source: "rag",
                    score: doc.score,
                    excerpt: doc.content
                        .replace(/```[\s\S]*?```/g, "")
                        .trim()
                        .slice(0, RAG_DOCUMENT_MAX_CHARS),
                }));
                const piped = await this.runValidationPipeline({
                    llmResponse,
                    initial,
                    context,
                    extractedData,
                    task: "rag_answer",
                    references,
                    log,
                });
                log.info({ step: "fsm_final", nextState: piped.final.nextState }, "fsm final");
                return this.finalizeWithPersist(context, piped.final, log, {
                    initial,
                    final: piped.final,
                    llmResponse,
                    messageToSend: piped.messageToSend,
                    internalDiagnostics: piped.diagnostics,
                    shouldPersist: piped.shouldPersist,
                });
            }
            case "reply": {
                const gen = await this.invokeLlm("generate_reply", context, log);
                if (!gen.ok) {
                    const final = initial;
                    return this.finalizeWithPersist(context, final, log, {
                        initial,
                        final,
                        messageToSend: SAFE_FALLBACK_MESSAGE,
                        internalDiagnostics: {
                            llmFailureReason: gen.errorDetail,
                        },
                    });
                }
                const { llmResponse } = gen;
                const extractedData = {
                    ...context.extractedData,
                };
                const piped = await this.runValidationPipeline({
                    llmResponse,
                    initial,
                    context,
                    extractedData,
                    task: "generate_reply",
                    references: [],
                    log,
                });
                log.info({ step: "fsm_final", nextState: piped.final.nextState }, "fsm final");
                return this.finalizeWithPersist(context, piped.final, log, {
                    initial,
                    final: piped.final,
                    llmResponse,
                    messageToSend: piped.messageToSend,
                    internalDiagnostics: piped.diagnostics,
                    shouldPersist: piped.shouldPersist,
                });
            }
            case "book_appointment":
            case "handover_human":
            default: {
                const final = initial;
                log.info({ step: "fsm_final", nextState: final.nextState }, "fsm final");
                return this.finalizeWithPersist(context, final, log, {
                    initial,
                    final,
                    messageToSend: DEFAULT_AI_MESSAGE,
                });
            }
        }
    }
    /**
     * Pipeline obligatorio post-AI:
     *   Validation -> Decision -> FSM transition check -> HardGate.
     *
     * Solo cuando `gate.allowed && decision.action === "accept"` se emite el
     * texto IA y se transiciona el estado FSM. En cualquier otro caso se devuelve
     * un mensaje de fallback seguro y se mantiene el estado actual.
     */
    async runValidationPipeline(args) {
        const { llmResponse, initial, context, extractedData, task, references, log } = args;
        const updatedContext = {
            ...context,
            currentState: initial.nextState,
            extractedData,
        };
        /**
         * El validator audita "la accion IA es valida en el estado donde el FSM
         * la autorizo" -> usar `context.currentState` ORIGINAL, no `nextState`.
         * `allowedActions` se deriva con la funcion pura, sin tocar FSMEngine.
         */
        const validationFsmContext = {
            ...context,
            extractedData,
            allowedActions: (0, fsm_types_1.getAllowedActionsForState)(context.currentState),
        };
        const validationContext = {
            tenantId: context.tenantId,
            leadId: context.leadId,
            traceId: context.traceId,
            task,
            expectedAction: task,
            userMessage: context.message,
            aiOutput: {
                text: llmResponse.text,
                confidence: llmResponse.confidence,
            },
            groundingReferences: references,
            fsmContext: validationFsmContext,
        };
        const validation = await this.validator.validate(validationContext);
        const decision = this.decisionMatrix.decide({
            validation,
            attemptNumber: 1,
            maxRetries: 0,
            fallbackAvailable: true,
            handoverAvailable: false,
        });
        const fsmTransition = this.transitionChecker.check({
            context: updatedContext,
        });
        const gate = this.hardGate.authorize({
            validation,
            decision,
            fsmTransition,
        });
        const metricsEvent = {
            tenantId: context.tenantId,
            traceId: context.traceId,
            task,
            validation,
            decision,
            fsmTransition,
            hardGate: gate,
        };
        this.validationMetrics.recordValidation(metricsEvent);
        this.validationMetrics.recordDecision(metricsEvent);
        this.validationMetrics.recordHardGate(metricsEvent);
        log.info({
            step: "ai_validation_pipeline",
            task,
            validation_flags: validation.flags,
            validation_confidence: validation.scores.confidence,
            decision_action: decision.action,
            fsm_transition_allowed: fsmTransition.allowed,
            hard_gate_allowed: gate.allowed,
            hard_gate_reason: gate.reason,
        }, "ai validation pipeline");
        const shouldPersist = gate.allowed && decision.action === "accept";
        let messageToSend;
        let final;
        if (shouldPersist) {
            messageToSend = llmResponse.text;
            final = {
                nextState: fsmTransition.toState,
                action: fsmTransition.action ?? initial.action,
            };
        }
        else {
            messageToSend = SAFE_FALLBACK_MESSAGE;
            final = initial;
        }
        const diagnostics = {
            hardGateBlocked: !gate.allowed,
            hardGateReason: gate.reason,
            decisionAction: decision.action,
        };
        return {
            final,
            messageToSend,
            validation,
            decision,
            gate,
            diagnostics,
            shouldPersist,
        };
    }
    async finalizeWithPersist(context, final, log, partial) {
        this.metrics.incrementCounter("fsm_transitions_total", 1, {
            from_state: context.currentState,
            to_state: final.nextState,
        });
        const shouldPersist = partial.shouldPersist !== false;
        const persist = shouldPersist
            ? await this.persistFsmState(context, final, log)
            : { ok: true, outcome: "skipped_unchanged" };
        if (!persist.ok) {
            this.metrics.incrementCounter("fsm_persistence_failures_total");
        }
        else if (persist.outcome === "written") {
            this.metrics.incrementCounter("fsm_persistence_writes_total");
        }
        else {
            this.metrics.incrementCounter("fsm_persistence_unchanged_total");
        }
        const merged = {
            ...partial.internalDiagnostics,
            ...(persist.ok ? {} : { persistError: persist.error }),
        };
        const hasDiag = internalDiagnosticsNonEmpty(merged);
        const fsmPersistenceOutcome = persist.ok
            ? persist.outcome === "skipped_unchanged"
                ? "unchanged"
                : "written"
            : undefined;
        return {
            initial: partial.initial,
            final: partial.final,
            messageToSend: partial.messageToSend,
            ...(partial.llmResponse !== undefined
                ? { llmResponse: partial.llmResponse }
                : {}),
            fsmPersisted: persist.ok,
            ...(fsmPersistenceOutcome !== undefined
                ? { fsmPersistenceOutcome }
                : {}),
            ...(hasDiag ? { internalDiagnostics: merged } : {}),
        };
    }
    async persistFsmState(context, final, log) {
        if (context.currentState === final.nextState) {
            return { ok: true, outcome: "skipped_unchanged" };
        }
        try {
            log.info({
                step: "fsm_persist_attempt",
                leadId: context.leadId,
                from: context.currentState,
                to: final.nextState,
            }, "fsm persist attempt");
            await this.leadsRepository.updateFsmState({
                leadId: context.leadId,
                tenantId: context.tenantId,
                fsmState: final.nextState,
                updatedAt: new Date().toISOString(),
            });
            log.info({
                step: "fsm_persist",
                leadId: context.leadId,
                nextState: final.nextState,
            }, "fsm persist");
            return { ok: true, outcome: "written" };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log.error({
                step: "fsm_persist_error",
                error: msg,
                leadId: context.leadId,
                tenant_id: context.tenantId,
            }, "fsm persist error");
            return { ok: false, error: msg };
        }
    }
    async invokeLlm(task, context, log, options) {
        const input = options?.input ?? context.message;
        log.info({
            step: "llm_call",
            task,
            inputLength: input.length,
        }, "llm call");
        try {
            const llmResponse = await this.llm.generate({
                task,
                input,
                traceId: context.traceId,
                tenantId: context.tenantId,
            });
            log.info({
                step: "llm_response",
                provider: llmResponse?.provider,
                latency_ms: llmResponse?.latency_ms,
            }, "llm response");
            return { ok: true, llmResponse };
        }
        catch (err) {
            const detail = err instanceof Error ? err.message : String(err);
            log.error({
                step: "llm_error",
                task,
                error: detail,
                tenant_id: context.tenantId,
                lead_id: context.leadId,
                trace_id: context.traceId,
            }, "llm error");
            return { ok: false, errorDetail: detail };
        }
    }
    mergeClassify(context, llmResponse) {
        const intent = llmResponse?.data?.intent === "venta" ||
            llmResponse?.data?.intent === "soporte"
            ? llmResponse.data.intent
            : undefined;
        const newData = intent !== undefined ? { intent } : {};
        return {
            ...context.extractedData,
            ...newData,
        };
    }
    mergeExtractSlots(context, llm) {
        const newData = (llm.data ?? {});
        return {
            ...context.extractedData,
            ...newData,
        };
    }
}
exports.Orchestrator = Orchestrator;
