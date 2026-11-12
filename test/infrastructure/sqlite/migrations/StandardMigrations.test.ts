import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { Migrations } from "../../../../src/infrastructure/sqlite/migrations/Migrations.ts";

test("a new database lands on the last version with both tables", () => {
	const database = new Database(":memory:");

	Migrations.standard().apply(database);

	expect(versionOf(database)).toBe(4);
	expect(tablesOf(database)).toEqual(["entries", "users"]);
});

test("a database saved before there were versions keeps its rows and lands on the last version", () => {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
	);
	database.run("INSERT INTO entries (document) VALUES (?)", [
		JSON.stringify({ sourceId: "old-id", name: "Example" }),
	]);

	Migrations.standard().apply(database);

	const row = database.query("SELECT owner, document FROM entries").get() as {
		owner: string;
		document: string;
	};
	expect(row.owner).toBe("xaviuzz");
	expect(JSON.parse(row.document)).toEqual({
		sorzId: "old-id",
		name: "Example",
	});
	expect(versionOf(database)).toBe(4);
});

test("a database that already has every effect lands on the last version unchanged", () => {
	const database = new Database(":memory:");
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL, owner TEXT NOT NULL DEFAULT 'xaviuzz')",
	);
	database.run("INSERT INTO entries (document, owner) VALUES ('{}', 'ana')");
	database.run(
		"CREATE TABLE users (position INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, hash TEXT NOT NULL, role TEXT NOT NULL)",
	);

	Migrations.standard().apply(database);

	const row = database.query("SELECT owner FROM entries").get() as {
		owner: string;
	};
	expect(row.owner).toBe("ana");
	expect(versionOf(database)).toBe(4);
});

function versionOf(database: Database): number {
	const row = database.query("PRAGMA user_version").get() as {
		user_version: number;
	};
	return row.user_version;
}

function tablesOf(database: Database): string[] {
	const rows = database
		.query(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
		)
		.all() as { name: string }[];
	const names: string[] = [];
	for (const row of rows) {
		names.push(row.name);
	}
	return names;
}
