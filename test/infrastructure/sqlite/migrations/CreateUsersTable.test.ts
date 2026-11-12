import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { CreateUsersTable } from "../../../../src/infrastructure/sqlite/migrations/CreateUsersTable.ts";

test("creates the table that keeps the users", () => {
	const database = new Database(":memory:");

	new CreateUsersTable().apply(database);

	const saving = () =>
		database.run(
			"INSERT INTO users (username, hash, role) VALUES ('ana', 'hash', 'user')",
		);
	expect(saving).not.toThrow();
});

test("keeps the users of a table that already exists", () => {
	const database = new Database(":memory:");
	new CreateUsersTable().apply(database);
	database.run(
		"INSERT INTO users (username, hash, role) VALUES ('ana', 'hash', 'user')",
	);

	new CreateUsersTable().apply(database);

	const rows = database.query("SELECT username FROM users").all();
	expect(rows).toHaveLength(1);
});
