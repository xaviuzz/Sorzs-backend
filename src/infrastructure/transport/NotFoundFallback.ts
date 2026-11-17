import type { Fallback } from "./Fallback.ts";

export class NotFoundFallback implements Fallback {
	answer(_request: Request): Response {
		return new Response(null, { status: 404 });
	}
}
