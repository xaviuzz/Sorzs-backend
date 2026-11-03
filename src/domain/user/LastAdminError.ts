import { CallError } from "../../call/CallError.ts";
import type { ErrorCode } from "../../call/Reply.ts";

export class LastAdminError extends CallError {
	readonly code: ErrorCode = "LAST_ADMIN";

	constructor() {
		super("Sorzs must keep at least one admin");
	}
}
