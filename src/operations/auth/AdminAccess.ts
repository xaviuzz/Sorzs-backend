import type { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import type { Access } from "./Access.ts";

export class AdminAccess implements Access {
	constructor(private readonly users: Users) {}

	async permits(user: Username): Promise<boolean> {
		const found = await this.users.find(user);
		return found.role().isAdmin();
	}
}
