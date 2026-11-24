import type { Database } from "bun:sqlite";
import { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { SorzList } from "../../domain/sorz-list/SorzList.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";

export class SqliteSorzListRepository implements SorzListRepository {
	constructor(private readonly database: Database) {}

	async load(owner: Username): Promise<SorzList> {
		const query = this.database.query(
			"SELECT document FROM entries WHERE owner = ? ORDER BY position",
		);
		const rows = query.all(owner.toString()) as { document: string }[];
		const list = SqliteSorzListRepository.listOf(rows);
		return list;
	}

	async loadEveryList(): Promise<SorzList[]> {
		const query = this.database.query(
			"SELECT owner, document FROM entries ORDER BY owner, position",
		);
		const rows = query.all() as { owner: string; document: string }[];
		const rowsByOwner = SqliteSorzListRepository.groupedByOwner(rows);
		const lists: SorzList[] = [];
		for (const rowsOfOwner of rowsByOwner.values()) {
			lists.push(SqliteSorzListRepository.listOf(rowsOfOwner));
		}
		return lists;
	}

	private static groupedByOwner(
		rows: { owner: string; document: string }[],
	): Map<string, { document: string }[]> {
		const rowsByOwner = new Map<string, { document: string }[]>();
		for (const row of rows) {
			let rowsOfOwner = rowsByOwner.get(row.owner);
			if (!rowsOfOwner) {
				rowsOfOwner = [];
				rowsByOwner.set(row.owner, rowsOfOwner);
			}
			rowsOfOwner.push(row);
		}
		return rowsByOwner;
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
