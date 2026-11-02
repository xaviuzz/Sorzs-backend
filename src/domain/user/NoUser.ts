import { Role } from "./Role.ts";
import type { User } from "./User.ts";

export class NoUser implements User {
	async accepts(_plain: string): Promise<boolean> {
		return false;
	}

	role(): Role {
		return Role.user();
	}
}
