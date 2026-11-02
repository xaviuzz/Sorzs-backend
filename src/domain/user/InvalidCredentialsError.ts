import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class InvalidCredentialsError extends CallError {
	readonly code: ErrorCode = "INVALID_CREDENTIALS";

	constructor() {
		super("invalid credentials");
	}
}
