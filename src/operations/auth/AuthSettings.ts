import { Password } from "../../domain/user/Password.ts";
import { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import { HmacTokenSigner } from "../../infrastructure/crypto/HmacTokenSigner.ts";
import { InMemoryUsers } from "../../infrastructure/memory/InMemoryUsers.ts";
import { MissingSettingError } from "./MissingSettingError.ts";

type Environment = Record<string, string | undefined>;

export class AuthSettings {
	private constructor(
		private readonly secret: string,
		private readonly seedUser: string,
		private readonly seedPassword: string,
	) {}

	static fromEnv(environment: Environment): AuthSettings {
		const secret = AuthSettings.require(environment, "AUTH_SECRET");
		const seedUser = AuthSettings.require(environment, "SEED_USER");
		const seedPassword = AuthSettings.require(environment, "SEED_PASSWORD");
		return new AuthSettings(secret, seedUser, seedPassword);
	}

	users(): Users {
		const name = Username.from(this.seedUser);
		const password = Password.hashing(this.seedPassword);
		return new InMemoryUsers([new RegisteredUser(name, password)]);
	}

	signer(): TokenSigner {
		return new HmacTokenSigner(this.secret);
	}

	private static require(environment: Environment, setting: string): string {
		const value = environment[setting];
		if (value === undefined || value === "")
			throw new MissingSettingError(setting);
		return value;
	}
}
