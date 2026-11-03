import { ForbiddenCall } from "../../call/ForbiddenCall.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { JsonOperation } from "../JsonOperation.ts";
import type { Operation } from "../Operation.ts";
import { OwnedBy } from "../OwnedBy.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";
import type { Access } from "./Access.ts";

export class ProtectedOperation implements Operation {
	constructor(
		private readonly handler: OwnedHandler,
		private readonly signer: TokenSigner,
		private readonly access: Access,
	) {}

	get name(): string {
		return this.handler.name;
	}

	async serve(request: Request): Promise<Response> {
		const token = this.readToken(request);
		let response = this.refuse();
		if (this.signer.recognizes(token)) {
			response = await this.serveIfPermitted(request, token);
		}
		return response;
	}

	private async serveIfPermitted(
		request: Request,
		token: string,
	): Promise<Response> {
		const owner = this.signer.userOf(token);
		const isPermitted = await this.access.permits(owner);
		let response = this.refuse();
		if (isPermitted) {
			const owned = new OwnedBy(owner, this.handler);
			response = await new JsonOperation(owned).serve(request);
		}
		return response;
	}

	private readToken(request: Request): string {
		const header = request.headers.get("authorization");
		if (header === null) return "";
		const prefix = "Bearer ";
		if (!header.startsWith(prefix)) return "";
		return header.slice(prefix.length);
	}

	private refuse(): Response {
		return new ForbiddenCall().toResponse();
	}
}
