import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class InvalidRoleError extends CallError {
	readonly code: ErrorCode = "INVALID_BODY";

	constructor() {
		super("role must be admin or user");
	}
}
