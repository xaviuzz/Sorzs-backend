import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class InvalidAddressError extends CallError {
	readonly code: ErrorCode = "INVALID_BODY";
}
