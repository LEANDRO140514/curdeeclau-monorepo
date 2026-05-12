import type {
  MetricsPort,
  ValidationMetricsEvent,
} from "./AIValidationLayer";

/**
 * Stub de `MetricsPort`. Cumple el contrato sin emitir métricas reales.
 * Permite enchufar un adaptador Prometheus / OpenTelemetry más adelante.
 */
export class NoopValidationMetricsPort implements MetricsPort {
  recordValidation(_event: ValidationMetricsEvent): void {}

  recordDecision(_event: ValidationMetricsEvent): void {}

  recordHardGate(_event: ValidationMetricsEvent): void {}
}
