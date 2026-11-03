import type { RegisteredUser } from "./RegisteredUser.ts";
import type { Role } from "./Role.ts";
import type { User } from "./User.ts";
import type { Username } from "./Username.ts";

export interface Users {
	find(name: Username): Promise<User>;
	list(): Promise<RegisteredUser[]>;
	add(user: RegisteredUser): Promise<void>;
	setRole(name: Username, role: Role): Promise<void>;
}
