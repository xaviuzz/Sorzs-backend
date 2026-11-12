import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import type { Migration } from "../../../../src/infrastructure/sqlite/migrations/Migration.ts";
import { MigrationFailedError } from "../../../../src/infrastructure/sqlite/migrations/MigrationFailedError.ts";
import { Migrations } from "../../../../src/infrastructure/sqlite/migrations/Migrations.ts";
import { NewerDatabaseError } from "../../../../src/infrastructure/sqlite/migrations/NewerDatabaseError.ts";

test("applies every migration in order and records the last version", () => {
	const sut = new MigrationsSut([
		new CreatesTable("first"),
		new CreatesTable("second"),
	]);

	sut.migrate();

	expect(sut.tables()).toEqual(["first", "second"]);
	expect(sut.version()).toBe(2);
});

test("applies only the migrations after the recorded version", () => {
	const sut = new MigrationsSut([
		new CreatesTable("first"),
		new CreatesTable("second"),
	]);
	sut.startAtVersion(1);

	sut.migrate();

	expect(sut.tables()).toEqual(["second"]);
	expect(sut.version()).toBe(2);
});

test("rolls back the failing migration and keeps the version of the earlier ones", () => {
	const sut = new MigrationsSut([
		new CreatesTable("first"),
		new CreatesTableThenFails(),
	]);

	const migrating = () => sut.migrate();

	expect(migrating).toThrow(MigrationFailedError);
	expect(sut.tables()).toEqual(["first"]);
	expect(sut.version()).toBe(1);
});

test("names the failing migration and its reason", () => {
	const sut = new MigrationsSut([new CreatesTableThenFails()]);

	const migrating = () => sut.migrate();

	expect(migrating).toThrow("CreatesTableThenFails");
	expect(migrating).toThrow("boom");
});

test("refuses a database newer than the last migration and leaves it as it was", () => {
	const sut = new MigrationsSut([
		new CreatesTable("first"),
		new CreatesTable("second"),
	]);
	sut.startAtVersion(5);

	const migrating = () => sut.migrate();

	expect(migrating).toThrow(NewerDatabaseError);
	expect(sut.tables()).toEqual([]);
	expect(sut.version()).toBe(5);
});

test("changes nothing when the database is at the last version", () => {
	const sut = new MigrationsSut([
		new CreatesTable("first"),
		new CreatesTable("second"),
	]);
	sut.startAtVersion(2);

	sut.migrate();

	expect(sut.tables()).toEqual([]);
	expect(sut.version()).toBe(2);
});

class CreatesTable implements Migration {
	constructor(private readonly table: string) {}

	apply(database: Database): void {
		database.run(`CREATE TABLE ${this.table} (id INTEGER)`);
	}
}

class CreatesTableThenFails implements Migration {
	apply(database: Database): void {
		database.run("CREATE TABLE half (id INTEGER)");
		throw new Error("boom");
	}
}

class MigrationsSut {
	private readonly database = new Database(":memory:");

	constructor(private readonly migrations: Migration[]) {}

	startAtVersion(version: number): void {
		this.database.run(`PRAGMA user_version = ${version}`);
	}

	migrate(): void {
		new Migrations(this.migrations).apply(this.database);
	}

	version(): number {
		const row = this.database.query("PRAGMA user_version").get() as {
			user_version: number;
		};
		return row.user_version;
	}

	tables(): string[] {
		const rows = this.database
			.query(
				"SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
			)
			.all() as { name: string }[];
		const names: string[] = [];
		for (const row of rows) {
			names.push(row.name);
		}
		return names;
	}
}
