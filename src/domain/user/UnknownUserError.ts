import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class UnknownUserError extends CallError {
	readonly code: ErrorCode = "INVALID_BODY";

	constructor() {
		super("there is no user with that username");
	}
}
