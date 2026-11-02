import type { Password } from "./Password.ts";
import { Role } from "./Role.ts";
import type { User } from "./User.ts";
import type { Username } from "./Username.ts";

export class RegisteredUser implements User {
	constructor(
		private readonly name: Username,
		private readonly password: Password,
		private readonly assigned: Role = Role.user(),
	) {}

	isNamed(name: Username): boolean {
		return this.name.equals(name);
	}

	accepts(plain: string): Promise<boolean> {
		return this.password.matches(plain);
	}

	role(): Role {
		return this.assigned;
	}
}
