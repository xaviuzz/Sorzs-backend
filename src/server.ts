import { OperationRegistry } from "./operations/OperationRegistry.ts";

export class Server {
	private constructor(private readonly bunServer: Bun.Server<undefined>) {}

	static start(port: number): Server {
		const operations = OperationRegistry.standard();
		const bunServer = Bun.serve({
			port,
			routes: operations.routes(),
			fetch: () => new Response(null, { status: 404 }),
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
