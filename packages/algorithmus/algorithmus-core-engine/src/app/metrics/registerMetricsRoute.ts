import type { Express, RequestHandler } from "express";
import type { PrometheusMetricsAdapter } from "../../infra/observability/metrics/PrometheusMetricsAdapter";

export function registerMetricsRoute(
  app: Express,
  prometheus: PrometheusMetricsAdapter,
): void {
  const handler: RequestHandler = async (_req, res, next) => {
    try {
      res.setHeader("Content-Type", prometheus.contentType);
      res.end(await prometheus.metrics());
    } catch (err) {
      next(err);
    }
  };
  app.get("/metrics", handler);
}
