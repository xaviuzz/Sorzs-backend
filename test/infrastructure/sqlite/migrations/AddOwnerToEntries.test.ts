import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { AddOwnerToEntries } from "../../../../src/infrastructure/sqlite/migrations/AddOwnerToEntries.ts";

test("gives the entries saved before there were owners to xaviuzz", () => {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
	);
	database.run("INSERT INTO entries (document) VALUES ('{}')");

	new AddOwnerToEntries().apply(database);

	expect(ownersOf(database)).toEqual(["xaviuzz"]);
});

test("leaves the owners of a table that already has them", () => {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL, owner TEXT NOT NULL DEFAULT 'xaviuzz')",
	);
	database.run("INSERT INTO entries (document, owner) VALUES ('{}', 'ana')");

	new AddOwnerToEntries().apply(database);

	expect(ownersOf(database)).toEqual(["ana"]);
});

function ownersOf(database: Database): string[] {
	const rows = database.query("SELECT owner FROM entries").all() as {
		owner: string;
	}[];
	const owners: string[] = [];
	for (const row of rows) {
		owners.push(row.owner);
	}
	return owners;
}
