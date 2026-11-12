import type { Database } from "bun:sqlite";
import type { Migration } from "./Migration.ts";

export class AddOwnerToEntries implements Migration {
	apply(database: Database): void {
		const columns = database.query("PRAGMA table_info(entries)").all() as {
			name: string;
		}[];
		const hasOwner = columns.some((column) => column.name === "owner");
		if (!hasOwner)
			database.run(
				"ALTER TABLE entries ADD COLUMN owner TEXT NOT NULL DEFAULT 'xaviuzz'",
			);
	}
}
