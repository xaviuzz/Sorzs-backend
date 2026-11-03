import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class UsernameTakenError extends CallError {
	readonly code: ErrorCode = "USERNAME_TAKEN";

	constructor() {
		super("that username is already taken");
	}
}
