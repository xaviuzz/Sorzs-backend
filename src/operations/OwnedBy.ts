import type { Call } from "../call/Call.ts";
import type { Username } from "../domain/user/Username.ts";
import type { JsonHandler } from "../infrastructure/transport/JsonTransport.ts";
import type { OwnedHandler } from "./OwnedHandler.ts";

export class OwnedBy implements JsonHandler {
	constructor(
		private readonly owner: Username,
		private readonly handler: OwnedHandler,
	) {}

	get name(): string {
		return this.handler.name;
	}

	execute(call: Call): Promise<unknown> {
		return this.handler.execute(call, this.owner);
	}
}
