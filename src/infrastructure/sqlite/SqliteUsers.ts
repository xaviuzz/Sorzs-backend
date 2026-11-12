import type { Database } from "bun:sqlite";
import { Password } from "../../domain/user/Password.ts";
import { RegisteredUser } from "../../domain/user/RegisteredUser.ts";
import { Role } from "../../domain/user/Role.ts";
import { Roster } from "../../domain/user/Roster.ts";
import type { User } from "../../domain/user/User.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";

type Row = { username: string; hash: string; role: string };

export class SqliteUsers implements Users {
	constructor(
		private readonly database: Database,
		seeded: RegisteredUser[],
	) {
		for (const user of seeded) {
			SqliteUsers.insertIfAbsent(database, user);
		}
	}

	private static insertIfAbsent(
		database: Database,
		user: RegisteredUser,
	): void {
		const record = user.toRecord();
		database.run(
			"INSERT OR IGNORE INTO users (username, hash, role) VALUES (?, ?, ?)",
			[record.username, record.hash, record.role],
		);
	}

	async find(name: Username): Promise<User> {
		return this.roster().find(name);
	}

	async list(): Promise<RegisteredUser[]> {
		return this.roster().list();
	}

	async add(user: RegisteredUser): Promise<void> {
		this.roster().with(user);
		const record = user.toRecord();
		this.database.run(
			"INSERT INTO users (username, hash, role) VALUES (?, ?, ?)",
			[record.username, record.hash, record.role],
		);
	}

	async setRole(name: Username, role: Role): Promise<void> {
		this.roster().withRole(name, role);
		this.database.run("UPDATE users SET role = ? WHERE username = ?", [
			role.toString(),
			name.toString(),
		]);
	}

	private roster(): Roster {
		const query = this.database.query(
			"SELECT username, hash, role FROM users ORDER BY position",
		);
		const rows = query.all() as Row[];
		const users: RegisteredUser[] = [];
		for (const row of rows) {
			users.push(SqliteUsers.toUser(row));
		}
		return new Roster(users);
	}

	private static toUser(row: Row): RegisteredUser {
		return new RegisteredUser(
			Username.from(row.username),
			Password.fromHash(row.hash),
			Role.named(row.role),
		);
	}
}
