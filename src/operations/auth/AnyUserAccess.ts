import type { Username } from "../../domain/user/Username.ts";
import type { Access } from "./Access.ts";

export class AnyUserAccess implements Access {
	async permits(_user: Username): Promise<boolean> {
		return true;
	}
}
