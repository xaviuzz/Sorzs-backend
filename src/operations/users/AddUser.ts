import type { Call } from "../../call/Call.ts";
import { Password } from "../../domain/user/Password.ts";
import { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import { Role } from "../../domain/user/Role.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class AddUser implements OwnedHandler {
	readonly name = "users.add";

	constructor(private readonly users: Users) {}

	async execute(call: Call, _asker: Username): Promise<unknown> {
		const name = Username.from(call.body.requireFilledText("username"));
		const password = Password.hashing(call.body.requireFilledText("password"));
		const role = Role.from(call.body.requireText("role"));
		const joining = new RegisteredUser(name, password, role);
		await this.users.add(joining);
		return joining.toJSON();
	}
}
