import type { Role } from "./Role.ts";

export interface User {
	accepts(plain: string): Promise<boolean>;
	role(): Role;
}
