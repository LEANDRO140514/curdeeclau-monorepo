/**
 * Buckets por histograma (segundos) para SLOs / p95 en Grafana.
 * Centralizado en infra (prom-client); el core no importa este módulo.
 */

const DEFAULT_SEC = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30,
];

/** HTTP / webhooks: colas cortas + cola larga. */
const REQUEST_DURATION_SEC = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10,
];

/** LLM: foco sub-segundo → 10s. */
const LLM_LATENCY_SEC = [0.1, 0.3, 0.5, 1, 2, 5, 10];

/** RAG retrieval (vector + red). */
const RAG_LATENCY_SEC = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30];

/** Cola BullMQ: espera hasta backlog grande. */
const QUEUE_LAG_SEC = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60,
];

/** Duración de procesamiento de job. */
const QUEUE_JOB_DURATION_SEC = [
  0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120,
];

export function histogramBucketsForMetricName(metricName: string): number[] {
  switch (metricName) {
    case "request_duration_seconds":
      return REQUEST_DURATION_SEC;
    case "llm_latency_seconds":
      return LLM_LATENCY_SEC;
    case "rag_latency_seconds":
      return RAG_LATENCY_SEC;
    case "queue_lag_seconds":
      return QUEUE_LAG_SEC;
    case "queue_job_duration_seconds":
      return QUEUE_JOB_DURATION_SEC;
    default:
      return DEFAULT_SEC;
  }
}
