import type { Database } from "bun:sqlite";
import type { Migration } from "./Migration.ts";

export class RenameOldIdentifierKey implements Migration {
	apply(database: Database): void {
		database.run(
			`UPDATE entries
			SET document = json_remove(
				json_set(document, '$.sorzId', json_extract(document, '$.sourceId')),
				'$.sourceId')
			WHERE json_type(document, '$.sourceId') IS NOT NULL`,
		);
	}
}
