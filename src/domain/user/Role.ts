import { InvalidRoleError } from "./InvalidRoleError.ts";

export class Role {
	private constructor(private readonly text: string) {}

	static admin(): Role {
		return new Role("admin");
	}

	static user(): Role {
		return new Role("user");
	}

	static isKnown(text: string): boolean {
		const known = [Role.admin(), Role.user()];
		return known.some((role) => role.text === text);
	}

	static from(text: string): Role {
		if (!Role.isKnown(text)) throw new InvalidRoleError();
		return new Role(text);
	}

	static named(text: string): Role {
		return new Role(text);
	}

	isAdmin(): boolean {
		return this.text === Role.admin().text;
	}

	toString(): string {
		return this.text;
	}
}
