import { performance } from "node:perf_hooks";
import app from "../src/app.js";

// This script intentionally starts its own server bound to loopback on an
// ephemeral port. It cannot direct load at the deployed production website.
const clients = Math.max(1, Math.min(100, Number.parseInt(process.env.LOAD_TEST_CLIENTS || "20", 10) || 20));
const iterations = Math.max(1, Math.min(100, Number.parseInt(process.env.LOAD_TEST_ITERATIONS || "10", 10) || 10));
const endpoints = ["/api/health", "/api/live-counts", "/api/game-config"];
const server = app.listen(0, "127.0.0.1");

function percentile(sorted, q) {
  if (!sorted.length) return null;
  return Number(sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)].toFixed(2));
}

try {
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const measurements = [];
  let errors = 0;

  await Promise.all(Array.from({ length: clients }, async (_, clientIndex) => {
    for (let i = 0; i < iterations; i += 1) {
      const endpoint = endpoints[(clientIndex + i) % endpoints.length];
      const started = performance.now();
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { signal: AbortSignal.timeout(5000) });
        await response.arrayBuffer();
        measurements.push({ endpoint, durationMs: performance.now() - started, status: response.status });
        if (!response.ok) errors += 1;
      } catch {
        errors += 1;
        measurements.push({ endpoint, durationMs: performance.now() - started, status: 0 });
      }
    }
  }));

  const allDurations = measurements.map((item) => item.durationMs).sort((a, b) => a - b);
  const byRoute = endpoints.map((endpoint) => {
    const rows = measurements.filter((item) => item.endpoint === endpoint);
    const durations = rows.map((item) => item.durationMs).sort((a, b) => a - b);
    return {
      endpoint,
      requests: rows.length,
      errors: rows.filter((item) => item.status < 200 || item.status >= 400).length,
      p50Ms: percentile(durations, 0.5),
      p95Ms: percentile(durations, 0.95),
      p99Ms: percentile(durations, 0.99),
      maxMs: durations.length ? Number(durations.at(-1).toFixed(2)) : null,
    };
  });

  console.log(JSON.stringify({
    target: "local loopback Express app only (not Socket.IO, PostgreSQL, or production)",
    clients,
    iterationsPerClient: iterations,
    totalRequests: measurements.length,
    errors,
    errorRatePercent: Number((errors / Math.max(1, measurements.length) * 100).toFixed(2)),
    p50Ms: percentile(allDurations, 0.5),
    p95Ms: percentile(allDurations, 0.95),
    p99Ms: percentile(allDurations, 0.99),
    routes: byRoute,
    note: "Synthetic local route throughput only; it does not validate real multiplayer, external database latency, bots, or device performance.",
  }, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
