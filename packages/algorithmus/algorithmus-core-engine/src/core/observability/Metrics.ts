export type MetricLabels = Record<
  string,
  string | number | boolean | undefined
>;

export interface Metrics {
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

export class NoopMetrics implements Metrics {
  incrementCounter(
    _name: string,
    _value?: number,
    _labels?: MetricLabels,
  ): void {}

  observeHistogram(
    _name: string,
    _valueSeconds: number,
    _labels?: MetricLabels,
  ): void {}

  setGauge(_name: string, _value: number, _labels?: MetricLabels): void {}
}
