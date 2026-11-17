import type { Database } from "bun:sqlite";
import { Password } from "../../domain/user/Password.ts";
import { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import { Role } from "../../domain/user/Role.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import { HmacTokenSigner } from "../../infrastructure/crypto/HmacTokenSigner.ts";
import { SqliteUsers } from "../../infrastructure/sqlite/SqliteUsers.ts";
import {
	Environment,
	type EnvironmentVariables,
} from "../settings/Environment.ts";
import { InvalidSettingError } from "../settings/InvalidSettingError.ts";

export class AuthSettings {
	private constructor(
		private readonly secret: string,
		private readonly seeded: RegisteredUser[],
	) {}

	static fromEnv(variables: EnvironmentVariables): AuthSettings {
		const environment = new Environment(variables);
		const secret = environment.require("AUTH_SECRET");
		const pairs = environment.require("SEED_USERS");
		const seeded = AuthSettings.readUsers(pairs);
		return new AuthSettings(secret, seeded);
	}

	users(database: Database): Users {
		return new SqliteUsers(database, this.seeded);
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
}
