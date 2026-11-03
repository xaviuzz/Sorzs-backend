import { Password } from "../../domain/user/Password.ts";
import { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import { Role } from "../../domain/user/Role.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import { HmacTokenSigner } from "../../infrastructure/crypto/HmacTokenSigner.ts";
import { SqliteUsers } from "../../infrastructure/sqlite/SqliteUsers.ts";
import { InvalidSettingError } from "./InvalidSettingError.ts";
import { MissingSettingError } from "./MissingSettingError.ts";

type Environment = Record<string, string | undefined>;

export class AuthSettings {
	private constructor(
		private readonly secret: string,
		private readonly seeded: RegisteredUser[],
	) {}

	static fromEnv(environment: Environment): AuthSettings {
		const secret = AuthSettings.require(environment, "AUTH_SECRET");
		const pairs = AuthSettings.require(environment, "SEED_USERS");
		const seeded = AuthSettings.readUsers(pairs);
		return new AuthSettings(secret, seeded);
	}

	users(dataDir: string): Users {
		return SqliteUsers.inFolder(dataDir, this.seeded);
	}

	signer(): TokenSigner {
		return new HmacTokenSigner(this.secret);
	}

	private static readUsers(pairs: string): RegisteredUser[] {
		const seeded: RegisteredUser[] = [];
		for (const pair of pairs.split(",")) {
			seeded.push(AuthSettings.readUser(pair));
		}
		return seeded;
	}

	private static readUser(pair: string): RegisteredUser {
		const [name = "", password = "", roleText = "user", ...extra] =
			pair.split(":");
		const isWellFormed =
			name !== "" &&
			password !== "" &&
			extra.length === 0 &&
			Role.isKnown(roleText);
		if (!isWellFormed)
			throw new InvalidSettingError(
				"SEED_USERS",
				"username:password[:role] pairs separated by commas, role being admin or user",
			);
		return new RegisteredUser(
			Username.from(name),
			Password.hashing(password),
			Role.named(roleText),
		);
	}

	private static require(environment: Environment, setting: string): string {
		const value = environment[setting];
		if (value === undefined || value === "")
			throw new MissingSettingError(setting);
		return value;
	}
}
