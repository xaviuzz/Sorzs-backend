import type { Call } from "../../call/Call.ts";
import { Role } from "../../domain/user/Role.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class SetRole implements OwnedHandler {
	readonly name = "users.setRole";

	constructor(private readonly users: Users) {}

	async execute(call: Call, _asker: Username): Promise<unknown> {
		const name = Username.from(call.body.requireText("username"));
		const role = Role.from(call.body.requireText("role"));
		await this.users.setRole(name, role);
		return { username: name.toString(), role: role.toString() };
	}
}
