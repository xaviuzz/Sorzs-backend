import { AuthSettings } from "../src/operations/auth/AuthSettings.ts";
import type { EnvironmentVariables } from "../src/operations/settings/Environment.ts";
import { StaticSettings } from "../src/operations/settings/StaticSettings.ts";
import { SearchSettings } from "../src/operations/sorzs/SearchSettings.ts";
import { Server } from "../src/server.ts";
import { CannedWebFetch } from "./CannedWebFetch.ts";
import { Latency } from "./Latency.ts";
import { LatentPageReader } from "./LatentPageReader.ts";

export class BenchmarkServer {
	private constructor(private readonly server: Server) {}

	static start(
		port: number,
		dataDir: string,
		variables: EnvironmentVariables,
		latencyMs: number,
	): BenchmarkServer {
		const latency = new Latency(latencyMs);
		const web = new CannedWebFetch(latency).asWebFetch();
		const server = Server.start(
			port,
			dataDir,
			AuthSettings.fromEnv(variables),
			SearchSettings.fromEnv(variables, web),
			StaticSettings.fromEnv(variables),
			new LatentPageReader(latency),
		);
		return new BenchmarkServer(server);
	}

	get url(): URL {
		return this.server.url;
	}

	stop(): void {
		this.server.stop();
	}
}
