import type { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import type { Role } from "../../domain/user/Role.ts";
import { Roster } from "../../domain/user/Roster.ts";
import type { User } from "../../domain/user/User.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";

export class InMemoryUsers implements Users {
	private roster: Roster;

	constructor(registered: RegisteredUser[]) {
		this.roster = new Roster(registered);
	}

	async find(name: Username): Promise<User> {
		return this.roster.find(name);
	}

	async list(): Promise<RegisteredUser[]> {
		return this.roster.list();
	}

	async add(user: RegisteredUser): Promise<void> {
		this.roster = this.roster.with(user);
	}

	async setRole(name: Username, role: Role): Promise<void> {
		this.roster = this.roster.withRole(name, role);
	}
}
