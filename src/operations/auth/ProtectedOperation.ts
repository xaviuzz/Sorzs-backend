import { ForbiddenCall } from "../../call/ForbiddenCall.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { JsonOperation } from "../JsonOperation.ts";
import type { Operation } from "../Operation.ts";
import { OwnedBy } from "../OwnedBy.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class ProtectedOperation implements Operation {
	constructor(
		private readonly handler: OwnedHandler,
		private readonly signer: TokenSigner,
	) {}

	get name(): string {
		return this.handler.name;
	}

	serve(request: Request): Promise<Response> {
		const token = this.readToken(request);
		let response = this.refuse();
		if (this.signer.recognizes(token)) {
			response = this.serveOwned(request, token);
		}
		return response;
	}

	private serveOwned(request: Request, token: string): Promise<Response> {
		const owner = this.signer.userOf(token);
		const owned = new OwnedBy(owner, this.handler);
		return new JsonOperation(owned).serve(request);
	}

	private readToken(request: Request): string {
		const header = request.headers.get("authorization");
		if (header === null) return "";
		const prefix = "Bearer ";
		if (!header.startsWith(prefix)) return "";
		return header.slice(prefix.length);
	}

	private refuse(): Promise<Response> {
		return Promise.resolve(new ForbiddenCall().toResponse());
	}
}
