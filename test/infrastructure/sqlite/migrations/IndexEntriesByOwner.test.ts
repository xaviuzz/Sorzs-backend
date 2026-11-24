import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { IndexEntriesByOwner } from "../../../../src/infrastructure/sqlite/migrations/IndexEntriesByOwner.ts";

test("finds the entries of one owner without scanning the whole table", () => {
	const database = databaseWithEntries();

	new IndexEntriesByOwner().apply(database);

	expect(planOfOwnerQuery(database)).toContain("SEARCH");
	expect(planOfOwnerQuery(database)).not.toContain("SCAN");
});

test("reads the entries of one owner in the order they were added without sorting", () => {
	const database = databaseWithEntries();

	new IndexEntriesByOwner().apply(database);

	expect(planOfOwnerQuery(database)).not.toContain("TEMP B-TREE");
});

test("keeps the rows it finds", () => {
	const database = databaseWithEntries();
	database.run("INSERT INTO entries (owner, document) VALUES ('ana', 'one')");
	database.run("INSERT INTO entries (owner, document) VALUES ('ana', 'two')");

	new IndexEntriesByOwner().apply(database);

	expect(documentsOf(database, "ana")).toEqual(["one", "two"]);
});

function databaseWithEntries(): Database {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL, owner TEXT NOT NULL DEFAULT 'xaviuzz')",
	);
	return database;
}

function planOfOwnerQuery(database: Database): string {
	const rows = database
		.query(
			"EXPLAIN QUERY PLAN SELECT document FROM entries WHERE owner = ? ORDER BY position",
		)
		.all("ana") as { detail: string }[];
	const details: string[] = [];
	for (const row of rows) {
		details.push(row.detail);
	}
	return details.join(" | ");
}

function documentsOf(database: Database, owner: string): string[] {
	const rows = database
		.query("SELECT document FROM entries WHERE owner = ? ORDER BY position")
		.all(owner) as { document: string }[];
	const documents: string[] = [];
	for (const row of rows) {
		documents.push(row.document);
	}
	return documents;
}
