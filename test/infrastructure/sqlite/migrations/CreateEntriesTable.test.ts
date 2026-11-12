import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { CreateEntriesTable } from "../../../../src/infrastructure/sqlite/migrations/CreateEntriesTable.ts";

test("creates the table that keeps the entries", () => {
	const database = new Database(":memory:");

	new CreateEntriesTable().apply(database);

	const saving = () =>
		database.run("INSERT INTO entries (document) VALUES ('{}')");
	expect(saving).not.toThrow();
});

test("keeps the entries of a table that already exists", () => {
	const database = new Database(":memory:");
	new CreateEntriesTable().apply(database);
	database.run("INSERT INTO entries (document) VALUES ('{}')");

	new CreateEntriesTable().apply(database);

	const rows = database.query("SELECT document FROM entries").all();
	expect(rows).toHaveLength(1);
});
