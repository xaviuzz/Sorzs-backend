import type { Username } from "../../domain/user/Username.ts";

export interface Access {
	permits(user: Username): Promise<boolean>;
}
