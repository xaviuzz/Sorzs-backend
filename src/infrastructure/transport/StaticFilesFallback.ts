import { join, resolve, sep } from "node:path";
import type { Fallback } from "./Fallback.ts";
import { NotFoundFallback } from "./NotFoundFallback.ts";

export class StaticFilesFallback implements Fallback {
	private readonly folder: string;
	private readonly notFound = new NotFoundFallback();

	constructor(
		folder: string,
		private readonly operationUrls: string[],
	) {
		this.folder = resolve(folder);
	}

	async answer(request: Request): Promise<Response> {
		const path = this.readPath(request);
		let response = this.notFound.answer(request);
		if (this.isServable(request, path)) response = await this.serve(path);
		return response;
	}

	private readPath(request: Request): string {
		const pathname = new URL(request.url).pathname;
		return decodeURIComponent(pathname);
	}

	private isServable(request: Request, path: string): boolean {
		const isGet = request.method === "GET";
		const isOperation = this.operationUrls.includes(path);
		const file = this.fileOf(path);
		const isInside = file === this.folder || file.startsWith(this.folder + sep);
		return isGet && !isOperation && isInside;
	}

	private async serve(path: string): Promise<Response> {
		const file = Bun.file(this.fileOf(path));
		const exists = await file.exists();
		let served = Bun.file(join(this.folder, "index.html"));
		if (exists) served = file;
		return new Response(served);
	}

	private fileOf(path: string): string {
		return resolve(join(this.folder, path));
	}
}
