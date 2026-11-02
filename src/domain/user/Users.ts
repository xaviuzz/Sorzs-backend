import type { User } from "./User.ts";
import type { Username } from "./Username.ts";

export interface Users {
	find(name: Username): Promise<User>;
}
