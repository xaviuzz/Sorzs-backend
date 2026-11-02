import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SourceEntry } from "../../domain/source-list/SourceEntry.ts";
import { SourceList } from "../../domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import { UnreadableSourceListError } from "./UnreadableSourceListError.ts";

export class SqliteSourceListRepository implements SourceListRepository {
	private readonly database: Database;

	static inFolder(folder: string): SqliteSourceListRepository {
		mkdirSync(folder, { recursive: true });
		const path = join(folder, "sorzs.db");
		return new SqliteSourceListRepository(path);
	}

	constructor(path: string) {
		this.database = SqliteSourceListRepository.open(path);
	}

	private static open(path: string): Database {
		try {
			const database = new Database(path);
			database.run(
				"CREATE TABLE IF NOT EXISTS entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
			);
			return database;
		} catch (error) {
			const reason = String(error);
			throw new UnreadableSourceListError(
				`the saved list at ${path} cannot be read: ${reason}`,
			);
		}
	}

	async load(): Promise<SourceList> {
		const query = this.database.query(
			"SELECT document FROM entries ORDER BY position",
		);
		const rows = query.all() as { document: string }[];
		const entries: SourceEntry[] = [];
		for (const row of rows) {
			const json = JSON.parse(row.document);
			entries.push(SourceEntry.fromJSON(json));
		}
		const list = new SourceList(entries);
		return list;
	}

	async add(entry: SourceEntry): Promise<void> {
		const document = JSON.stringify(entry);
		this.database.run("INSERT INTO entries (document) VALUES (?)", [document]);
	}
}
