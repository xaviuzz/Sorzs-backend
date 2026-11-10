import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { SorzList } from "../../domain/sorz-list/SorzList.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import { Username } from "../../domain/user/Username.ts";
import { UnreadableSorzListError } from "./UnreadableSorzListError.ts";

export class SqliteSorzListRepository implements SorzListRepository {
	private readonly database: Database;

	static inFolder(folder: string): SqliteSorzListRepository {
		mkdirSync(folder, { recursive: true });
		const path = join(folder, "sorzs.db");
		return new SqliteSorzListRepository(path);
	}

	constructor(path: string) {
		this.database = SqliteSorzListRepository.open(path);
	}

	private static open(path: string): Database {
		try {
			const database = new Database(path);
			database.run(
				"CREATE TABLE IF NOT EXISTS entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
			);
			SqliteSorzListRepository.giveOwnerToOldEntries(database);
			SqliteSorzListRepository.renameOldIdentifierKey(database);
			return database;
		} catch (error) {
			const reason = String(error);
			throw new UnreadableSorzListError(
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

	private static renameOldIdentifierKey(database: Database): void {
		database.run(
			`UPDATE entries
			SET document = json_remove(
				json_set(document, '$.sorzId', json_extract(document, '$.sourceId')),
				'$.sourceId')
			WHERE json_type(document, '$.sourceId') IS NOT NULL`,
		);
	}

	async load(owner: Username): Promise<SorzList> {
		const query = this.database.query(
			"SELECT document FROM entries WHERE owner = ? ORDER BY position",
		);
		const rows = query.all(owner.toString()) as { document: string }[];
		const list = SqliteSorzListRepository.listOf(rows);
		return list;
	}

	async loadEveryList(): Promise<SorzList[]> {
		const owners = this.database
			.query("SELECT DISTINCT owner FROM entries ORDER BY owner")
			.all() as { owner: string }[];
		const lists: SorzList[] = [];
		for (const { owner } of owners) {
			lists.push(await this.load(Username.from(owner)));
		}
		return lists;
	}

	private static listOf(rows: { document: string }[]): SorzList {
		const entries: SorzEntry[] = [];
		for (const row of rows) {
			const json = JSON.parse(row.document);
			entries.push(SorzEntry.fromJSON(json));
		}
		const list = new SorzList(entries);
		return list;
	}

	async add(owner: Username, entry: SorzEntry): Promise<void> {
		const document = JSON.stringify(entry);
		this.database.run("INSERT INTO entries (owner, document) VALUES (?, ?)", [
			owner.toString(),
			document,
		]);
	}
}
