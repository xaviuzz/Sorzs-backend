import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SourceEntry } from "../../domain/source-list/SourceEntry.ts";
import { SourceList } from "../../domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
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
			SqliteSourceListRepository.giveOwnerToOldEntries(database);
			return database;
		} catch (error) {
			const reason = String(error);
			throw new UnreadableSourceListError(
				`the saved list at ${path} cannot be read: ${reason}`,
			);
		}
	}

	private static giveOwnerToOldEntries(database: Database): void {
		const columns = database.query("PRAGMA table_info(entries)").all() as {
			name: string;
		}[];
		const hasOwner = columns.some((column) => column.name === "owner");
		if (!hasOwner)
			database.run(
				"ALTER TABLE entries ADD COLUMN owner TEXT NOT NULL DEFAULT 'xaviuzz'",
			);
	}

	async load(owner: Username): Promise<SourceList> {
		const query = this.database.query(
			"SELECT document FROM entries WHERE owner = ? ORDER BY position",
		);
		const rows = query.all(owner.toString()) as { document: string }[];
		const entries: SourceEntry[] = [];
		for (const row of rows) {
			const json = JSON.parse(row.document);
			entries.push(SourceEntry.fromJSON(json));
		}
		const list = new SourceList(entries);
		return list;
	}

	async add(owner: Username, entry: SourceEntry): Promise<void> {
		const document = JSON.stringify(entry);
		this.database.run("INSERT INTO entries (owner, document) VALUES (?, ?)", [
			owner.toString(),
			document,
		]);
	}
}
