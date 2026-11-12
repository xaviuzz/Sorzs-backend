import type { Database } from "bun:sqlite";
import type { Migration } from "./Migration.ts";

export class CreateUsersTable implements Migration {
	apply(database: Database): void {
		database.run(
			"CREATE TABLE IF NOT EXISTS users (position INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, hash TEXT NOT NULL, role TEXT NOT NULL)",
		);
	}
}
