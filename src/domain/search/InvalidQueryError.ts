import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class InvalidQueryError extends CallError {
	readonly code: ErrorCode = "INVALID_BODY";
}
