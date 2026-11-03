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

	sharesNameWith(other: RegisteredUser): boolean {
		return other.isNamed(this.name);
	}

	accepts(plain: string): Promise<boolean> {
		return this.password.matches(plain);
	}

	role(): Role {
		return this.assigned;
	}

	isAdmin(): boolean {
		return this.assigned.isAdmin();
	}

	withRole(role: Role): RegisteredUser {
		return new RegisteredUser(this.name, this.password, role);
	}

	toJSON(): { username: string; role: string } {
		return { username: this.name.toString(), role: this.assigned.toString() };
	}

	toRecord(): { username: string; hash: string; role: string } {
		return {
			username: this.name.toString(),
			hash: this.password.toString(),
			role: this.assigned.toString(),
		};
	}
}
