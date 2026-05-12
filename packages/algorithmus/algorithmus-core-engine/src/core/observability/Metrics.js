"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopMetrics = void 0;
class NoopMetrics {
    incrementCounter(_name, _value, _labels) { }
    observeHistogram(_name, _valueSeconds, _labels) { }
    setGauge(_name, _value, _labels) { }
}
exports.NoopMetrics = NoopMetrics;
