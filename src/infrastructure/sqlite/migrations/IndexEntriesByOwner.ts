import type { Database } from "bun:sqlite";
import type { Migration } from "./Migration.ts";

export class IndexEntriesByOwner implements Migration {
	apply(database: Database): void {
		database.run("CREATE INDEX entries_owner ON entries (owner, position)");
	}
}
