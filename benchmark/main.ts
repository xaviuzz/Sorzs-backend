import { BenchmarkServer } from "./BenchmarkServer.ts";

const port = Number(Bun.env.PORT ?? 3000);
const dataDir = Bun.env.DATA_DIR ?? "./data";
const latencyMs = Number(Bun.env.BENCHMARK_LATENCY_MS ?? 100);

BenchmarkServer.start(port, dataDir, Bun.env, latencyMs);
