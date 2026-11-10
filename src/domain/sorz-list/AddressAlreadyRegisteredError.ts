import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class AddressAlreadyRegisteredError extends CallError {
	readonly code: ErrorCode = "SORZ_ALREADY_REGISTERED";
}
