import type { Database } from "bun:sqlite";
import type { Migration } from "./Migration.ts";

export class CreateEntriesTable implements Migration {
	apply(database: Database): void {
		database.run(
			"CREATE TABLE IF NOT EXISTS entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
		);
	}
}
