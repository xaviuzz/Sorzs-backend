import { NoUser } from "../../domain/user/NoUser.ts";
import type { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import type { User } from "../../domain/user/User.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";

export class InMemoryUsers implements Users {
	constructor(private readonly registered: RegisteredUser[]) {}

	async find(name: Username): Promise<User> {
		const match = this.registered.find((user) => user.isNamed(name));
		let found: User = new NoUser();
		if (match !== undefined) {
			found = match;
		}
		return found;
	}
}
