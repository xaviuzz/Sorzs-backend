import type { Call } from "../../call/Call.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class ListUsers implements OwnedHandler {
	readonly name = "users.list";

	constructor(private readonly users: Users) {}

	async execute(_call: Call, _asker: Username): Promise<unknown> {
		const registered = await this.users.list();
		const listed = registered.map((user) => user.toJSON());
		return { users: listed };
	}
}
