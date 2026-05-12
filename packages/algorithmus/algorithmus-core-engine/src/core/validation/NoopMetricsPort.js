"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopValidationMetricsPort = void 0;
/**
 * Stub de `MetricsPort`. Cumple el contrato sin emitir métricas reales.
 * Permite enchufar un adaptador Prometheus / OpenTelemetry más adelante.
 */
class NoopValidationMetricsPort {
    recordValidation(_event) { }
    recordDecision(_event) { }
    recordHardGate(_event) { }
}
exports.NoopValidationMetricsPort = NoopValidationMetricsPort;
