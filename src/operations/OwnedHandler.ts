import type { Call } from "../call/Call.ts";
import type { Username } from "../domain/user/Username.ts";

export type OwnedHandler = {
	readonly name: string;
	execute(call: Call, owner: Username): Promise<unknown>;
};
