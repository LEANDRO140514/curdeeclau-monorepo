import type { Queue } from "bullmq";
import type { Logger } from "pino";
import type { Metrics } from "../../core/observability/Metrics";
import {
  MetricName,
  type BullmqQueueJobsLabels,
} from "./metrics/metricDefinitions";

export type BullmqQueueDepthExporterDeps = {
  queue: Queue;
  metrics: Metrics;
  log: Logger;
  /** Value for the `queue` label (e.g. WHATSAPP_INBOUND_QUEUE). */
  queueLabel: string;
  intervalMs: number;
};

export class BullmqQueueDepthExporter {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly deps: BullmqQueueDepthExporterDeps) {}

  start(): void {
    if (this.timer !== undefined) {
      return;
    }
    const tick = () => {
      void this.poll().catch((err: unknown) => {
        this.deps.log.warn(
          { err: err instanceof Error ? err.message : String(err) },
          "bullmq queue depth poll failed",
        );
      });
    };
    tick();
    this.timer = setInterval(tick, this.deps.intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async poll(): Promise<void> {
    const { queue, metrics, queueLabel } = this.deps;
    const counts = await queue.getJobCounts(
      "waiting",
      "active",
      "delayed",
      "paused",
    );

    const set = (state: BullmqQueueJobsLabels["state"], n: number) => {
      metrics.setGauge(MetricName.bullmq_queue_jobs, n, {
        queue: queueLabel,
        state,
      });
    };

    set("waiting", counts.waiting ?? 0);
    set("active", counts.active ?? 0);
    set("delayed", counts.delayed ?? 0);
    set("paused", counts.paused ?? 0);
  }
}
