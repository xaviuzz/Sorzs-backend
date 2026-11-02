import { ForbiddenCall } from "../../call/ForbiddenCall.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import type { Operation } from "../Operation.ts";

export class ProtectedOperation implements Operation {
	constructor(
		private readonly operation: Operation,
		private readonly signer: TokenSigner,
	) {}

	get name(): string {
		return this.operation.name;
	}

	serve(request: Request): Promise<Response> {
		const token = this.readToken(request);
		let response = this.refuse();
		if (this.signer.recognizes(token)) {
			response = this.operation.serve(request);
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

	private refuse(): Promise<Response> {
		return Promise.resolve(new ForbiddenCall().toResponse());
	}
}
