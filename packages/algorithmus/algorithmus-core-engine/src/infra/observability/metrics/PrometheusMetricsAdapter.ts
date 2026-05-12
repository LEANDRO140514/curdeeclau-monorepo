import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  type RegistryContentType,
} from "prom-client";
import type { MetricLabels, Metrics } from "../../../core/observability/Metrics";
import type { MetricsService } from "./MetricsService";
import { histogramBucketsForMetricName } from "./histogramBuckets";

function normalizeLabelRecord(
  labels: MetricLabels | undefined,
): Record<string, string> {
  if (!labels) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(labels)) {
    if (v === undefined) {
      continue;
    }
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

function sortedLabelKeys(labels: Record<string, string>): string[] {
  return Object.keys(labels).sort();
}

function cacheKey(metricName: string, labelKeys: string[]): string {
  return `${metricName}::${labelKeys.join("|")}`;
}

/** Adaptador Prometheus (`prom-client`); el core solo conoce `Metrics` / `MetricsService`. */
export class PrometheusMetricsAdapter implements Metrics, MetricsService {
  private readonly registry = new Registry<RegistryContentType>();

  private readonly counters = new Map<string, Counter<string>>();

  private readonly histograms = new Map<string, Histogram<string>>();

  private readonly gauges = new Map<string, Gauge<string>>();

  private readonly counterLabelKeys = new Map<string, string[]>();

  private readonly histogramLabelKeys = new Map<string, string[]>();

  private readonly gaugeLabelKeys = new Map<string, string[]>();

  get contentType(): string {
    return this.registry.contentType;
  }

  getRegistry(): Registry<RegistryContentType> {
    return this.registry;
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  incrementCounter(
    name: string,
    value = 1,
    labels?: MetricLabels,
  ): void {
    const normalized = normalizeLabelRecord(labels);
    const keys = sortedLabelKeys(normalized);
    const c = this.getOrCreateCounter(name, keys);
    if (keys.length === 0) {
      c.inc(value);
    } else {
      c.inc(normalized, value);
    }
  }

  observeHistogram(
    name: string,
    valueSeconds: number,
    labels?: MetricLabels,
  ): void {
    const normalized = normalizeLabelRecord(labels);
    const keys = sortedLabelKeys(normalized);
    const h = this.getOrCreateHistogram(name, keys);
    if (keys.length === 0) {
      h.observe(valueSeconds);
    } else {
      h.observe(normalized, valueSeconds);
    }
  }

  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const normalized = normalizeLabelRecord(labels);
    const keys = sortedLabelKeys(normalized);
    const g = this.getOrCreateGauge(name, keys);
    if (keys.length === 0) {
      g.set(value);
    } else {
      g.set(normalized, value);
    }
  }

  private getOrCreateCounter(
    name: string,
    labelKeys: string[],
  ): Counter<string> {
    const key = cacheKey(name, labelKeys);
    const existing = this.counters.get(key);
    if (existing) {
      return existing;
    }

    const prev = this.counterLabelKeys.get(name);
    if (prev !== undefined) {
      const a = prev.join("|");
      const b = labelKeys.join("|");
      if (a !== b) {
        throw new Error(
          `metrics: label keys for counter "${name}" mismatch: [${b}] vs registered [${a}]`,
        );
      }
    } else {
      this.counterLabelKeys.set(name, labelKeys);
    }

    const c = new Counter({
      name,
      help: `Counter ${name}`,
      labelNames: labelKeys,
      registers: [this.registry],
    });
    this.counters.set(key, c);
    return c;
  }

  private getOrCreateHistogram(
    name: string,
    labelKeys: string[],
  ): Histogram<string> {
    const key = cacheKey(name, labelKeys);
    const existing = this.histograms.get(key);
    if (existing) {
      return existing;
    }

    const prev = this.histogramLabelKeys.get(name);
    if (prev !== undefined) {
      const a = prev.join("|");
      const b = labelKeys.join("|");
      if (a !== b) {
        throw new Error(
          `metrics: label keys for histogram "${name}" mismatch: [${b}] vs registered [${a}]`,
        );
      }
    } else {
      this.histogramLabelKeys.set(name, labelKeys);
    }

    const h = new Histogram({
      name,
      help: `Histogram ${name}`,
      labelNames: labelKeys,
      buckets: histogramBucketsForMetricName(name),
      registers: [this.registry],
    });
    this.histograms.set(key, h);
    return h;
  }

  private getOrCreateGauge(
    name: string,
    labelKeys: string[],
  ): Gauge<string> {
    const key = cacheKey(name, labelKeys);
    const existing = this.gauges.get(key);
    if (existing) {
      return existing;
    }

    const prev = this.gaugeLabelKeys.get(name);
    if (prev !== undefined) {
      const a = prev.join("|");
      const b = labelKeys.join("|");
      if (a !== b) {
        throw new Error(
          `metrics: label keys for gauge "${name}" mismatch: [${b}] vs registered [${a}]`,
        );
      }
    } else {
      this.gaugeLabelKeys.set(name, labelKeys);
    }

    const g = new Gauge({
      name,
      help: `Gauge ${name}`,
      labelNames: labelKeys,
      registers: [this.registry],
    });
    this.gauges.set(key, g);
    return g;
  }
}
