/** HELP text for new metrics (documentation / Grafana). */
export const METRIC_HELP = {
  bullmq_queue_jobs:
    "BullMQ job counts by coarse state from Queue.getJobCounts (global per queue, not per tenant).",
  safety_port_evaluations_total:
    "Conteo de evaluaciones del SafetyPort (adapter de moderacion). Labels: outcome=safe|unsafe|error, reason?, tenant_id.",
  safety_port_latency_seconds:
    "Latencia (segundos) de la llamada al SafetyPort. Labels: outcome, tenant_id.",
  safety_validation_outcomes_total:
    "Conteo de evaluaciones del ProductionAIValidator vistas desde el core. Labels: outcome=safe|unsafe|error, tenant_id, timed_out?.",
  grounding_port_evaluations_total:
    "Conteo de evaluaciones del GroundingPort (Lexical Grounding v1). Labels: outcome=grounded|ungrounded, reason?=short_text|no_bigrams|no_excerpts, tenant_id.",
  grounding_port_latency_seconds:
    "Latencia (segundos) de la llamada al GroundingPort. Labels: outcome=grounded|ungrounded, tenant_id.",
  grounding_validation_outcomes_total:
    "Conteo de evaluaciones de grounding desde el ProductionAIValidator (post-port). Labels: outcome=grounded|ungrounded|error, tenant_id, timed_out?, reason?=skipped_task|no_refs|empty_output.",
} as const;

/** New metrics — source of truth for names introduced in observability phases. */
export const MetricName = {
  bullmq_queue_jobs: "bullmq_queue_jobs",
  safety_port_evaluations_total: "safety_port_evaluations_total",
  safety_port_latency_seconds: "safety_port_latency_seconds",
  safety_validation_outcomes_total: "safety_validation_outcomes_total",
  grounding_port_evaluations_total: "grounding_port_evaluations_total",
  grounding_port_latency_seconds: "grounding_port_latency_seconds",
  grounding_validation_outcomes_total: "grounding_validation_outcomes_total",
} as const;

export type NewMetricName = (typeof MetricName)[keyof typeof MetricName];

/**
 * Labels for bullmq_queue_jobs.
 * No tenant_id: getJobCounts() is not tenant-partitioned.
 */
export type BullmqQueueJobsLabels = {
  queue: string;
  state: "waiting" | "active" | "delayed" | "paused";
};

/**
 * Labels emitidas por el adapter `OpenAIModerationSafetyPort`.
 * `reason` solo presente cuando `outcome === "error"`.
 */
export type SafetyPortLabels = {
  outcome: "safe" | "unsafe" | "error";
  reason?: "timeout" | "http" | "parse" | "network" | "empty_input";
  tenant_id: string;
};

/**
 * Labels emitidas por `ProductionAIValidator` (capa core, post-safety).
 * `timed_out` solo presente cuando `outcome === "error"`.
 */
export type SafetyValidationLabels = {
  outcome: "safe" | "unsafe" | "error";
  tenant_id: string;
  timed_out?: "true" | "false";
};

/**
 * Labels emitidas por el adapter `LexicalGroundingPort`.
 * `reason` solo presente cuando el adapter no produjo score (texto IA muy
 * corto, sin bigramas tras tokenizar, o referencias sin excerpt).
 */
export type GroundingPortLabels = {
  outcome: "grounded" | "ungrounded";
  reason?: "short_text" | "no_bigrams" | "no_excerpts";
  tenant_id: string;
};

/**
 * Labels emitidas por `ProductionAIValidator` para el resultado post-grounding.
 * `timed_out` solo cuando `outcome === "error"`. `reason` solo cuando el
 * validator corto-circuita ANTES de invocar el port (task fuera de scope, sin
 * refs, output vacio).
 */
export type GroundingValidationLabels = {
  outcome: "grounded" | "ungrounded" | "error";
  tenant_id: string;
  timed_out?: "true" | "false";
  reason?: "skipped_task" | "no_refs" | "empty_output";
};
