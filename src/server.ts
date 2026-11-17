import { MigratedDatabaseFactory } from "./infrastructure/sqlite/MigratedDatabaseFactory.ts";
import type { AuthSettings } from "./operations/auth/AuthSettings.ts";
import { OperationRegistry } from "./operations/OperationRegistry.ts";
import type { StaticSettings } from "./operations/settings/StaticSettings.ts";
import type { SearchSettings } from "./operations/sorzs/SearchSettings.ts";

export class Server {
	private constructor(private readonly bunServer: Bun.Server<undefined>) {}

	static start(
		port: number,
		dataDir: string,
		auth: AuthSettings,
		search: SearchSettings,
		files: StaticSettings,
	): Server {
		const database = MigratedDatabaseFactory.standard().inFolder(dataDir);
		const operations = OperationRegistry.standard(database, auth, search);
		const routes = operations.routes();
		const fallback = files.fallback(Object.keys(routes));
		const bunServer = Bun.serve({
			port,
			routes,
			fetch: (request) => fallback.answer(request),
			error: () => new Response(null, { status: 500 }),
		});
		return new Server(bunServer);
	}

	get url(): URL {
		return this.bunServer.url;
	}

	stop(): void {
		this.bunServer.stop(true);
	}
}
