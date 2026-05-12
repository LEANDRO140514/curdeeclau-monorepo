import type { MetricLabels } from "../../../core/observability/Metrics";

/**
 * Puerto de métricas en la capa infraestructura.
 * Implementado por {@link PrometheusMetricsAdapter}; el core depende solo de `Metrics` (misma forma).
 */
export interface MetricsService {
  incrementCounter(
    name: string,
    value?: number,
    labels?: MetricLabels,
  ): void;
  observeHistogram(
    name: string,
    valueSeconds: number,
    labels?: MetricLabels,
  ): void;
  setGauge(name: string, value: number, labels?: MetricLabels): void;
}
