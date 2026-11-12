import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { RenameOldIdentifierKey } from "../../../../src/infrastructure/sqlite/migrations/RenameOldIdentifierKey.ts";

test("rewrites the old identifier key and keeps the rest of the document", () => {
	const database = entriesWith({
		sourceId: "old-id",
		name: "Example",
	});

	new RenameOldIdentifierKey().apply(database);

	expect(documentsOf(database)).toEqual([
		{ sorzId: "old-id", name: "Example" },
	]);
});

test("leaves the documents that already have the new key", () => {
	const database = entriesWith({
		sorzId: "new-id",
		name: "Example",
	});

	new RenameOldIdentifierKey().apply(database);

	expect(documentsOf(database)).toEqual([
		{ sorzId: "new-id", name: "Example" },
	]);
});

function entriesWith(document: object): Database {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
	);
	database.run("INSERT INTO entries (document) VALUES (?)", [
		JSON.stringify(document),
	]);
	return database;
}

function documentsOf(database: Database): object[] {
	const rows = database.query("SELECT document FROM entries").all() as {
		document: string;
	}[];
	const documents: object[] = [];
	for (const row of rows) {
		documents.push(JSON.parse(row.document));
	}
	return documents;
}
