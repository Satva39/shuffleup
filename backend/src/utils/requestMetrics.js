import { performance } from "node:perf_hooks";

const MAX_SAMPLES = 2000;
const samples = [];
const startedAt = Date.now();

function percentile(sortedValues, quantile) {
  if (!sortedValues.length) return null;
  const index = Math.min(sortedValues.length - 1, Math.ceil(quantile * sortedValues.length) - 1);
  return Math.round(sortedValues[index] * 100) / 100;
}

function sanitizeRoute(route) {
  return String(route || "/")
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "/:id")
    .replace(/\/[A-Z0-9]{6}(?=\/|$)/g, "/:roomCode")
    .slice(0, 120);
}

export function requestMetricsMiddleware(req, res, next) {
  if (req.path === "/api/performance-metrics") return next();
  const start = performance.now();
  res.once("finish", () => {
    const route = sanitizeRoute(`${req.method} ${req.route?.path || req.path}`);
    samples.push({
      route,
      durationMs: Math.max(0, performance.now() - start),
      statusCode: res.statusCode,
      at: Date.now(),
    });
    if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
  });
  next();
}

export function getPerformanceSnapshot() {
  const snapshot = [...samples];
  const durations = snapshot.map((item) => item.durationMs).sort((a, b) => a - b);
  const failed = snapshot.filter((item) => item.statusCode >= 500).length;
  const routes = new Map();

  for (const sample of snapshot) {
    if (!routes.has(sample.route)) routes.set(sample.route, []);
    routes.get(sample.route).push(sample);
  }

  const perRoute = [...routes.entries()].map(([route, routeSamples]) => {
    const routeDurations = routeSamples.map((item) => item.durationMs).sort((a, b) => a - b);
    const routeErrors = routeSamples.filter((item) => item.statusCode >= 500).length;
    return {
      route,
      requests: routeSamples.length,
      serverErrorRate: Math.round((routeErrors / routeSamples.length) * 10000) / 100,
      p50Ms: percentile(routeDurations, 0.5),
      p95Ms: percentile(routeDurations, 0.95),
      p99Ms: percentile(routeDurations, 0.99),
      maxMs: routeDurations.at(-1) === undefined ? null : Math.round(routeDurations.at(-1) * 100) / 100,
    };
  }).sort((a, b) => b.requests - a.requests);

  return {
    processStartedAt: new Date(startedAt).toISOString(),
    generatedAt: new Date().toISOString(),
    sampleWindow: snapshot.length,
    maxSampleWindow: MAX_SAMPLES,
    serverErrorRate: snapshot.length ? Math.round((failed / snapshot.length) * 10000) / 100 : null,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    p99Ms: percentile(durations, 0.99),
    routes: perRoute,
    limitations: "In-memory rolling window for this backend process only; not distributed across instances and not a substitute for external monitoring.",
  };
}

export function resetPerformanceSamplesForTest() {
  samples.length = 0;
}
