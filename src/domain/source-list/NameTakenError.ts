import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class NameTakenError extends CallError {
	readonly code: ErrorCode = "SOURCE_NAME_TAKEN";
}
