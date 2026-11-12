import type { Database } from "bun:sqlite";
import { AddOwnerToEntries } from "./AddOwnerToEntries.ts";
import { CreateEntriesTable } from "./CreateEntriesTable.ts";
import { CreateUsersTable } from "./CreateUsersTable.ts";
import type { Migration } from "./Migration.ts";
import { MigrationFailedError } from "./MigrationFailedError.ts";
import { NewerDatabaseError } from "./NewerDatabaseError.ts";
import { RenameOldIdentifierKey } from "./RenameOldIdentifierKey.ts";

export class Migrations {
	constructor(private readonly migrations: Migration[]) {}

	static standard(): Migrations {
		return new Migrations([
			new CreateEntriesTable(),
			new AddOwnerToEntries(),
			new RenameOldIdentifierKey(),
			new CreateUsersTable(),
		]);
	}

	apply(database: Database): void {
		this.requireNotNewer(database);
		this.applyPending(database);
	}

	private requireNotNewer(database: Database): void {
		const version = Migrations.versionOf(database);
		const lastKnown = this.migrations.length;
		const isKnown = version <= lastKnown;
		if (!isKnown)
			throw new NewerDatabaseError(
				`the database is at version ${version}, newer than the last one known, ${lastKnown}`,
			);
	}

	private applyPending(database: Database): void {
		const version = Migrations.versionOf(database);
		const pending = this.migrations.slice(version);
		let number = version;
		for (const migration of pending) {
			number += 1;
			Migrations.applyOne(database, migration, number);
		}
	}

	private static applyOne(
		database: Database,
		migration: Migration,
		number: number,
	): void {
		const inOneStep = database.transaction(() => {
			migration.apply(database);
			database.run(`PRAGMA user_version = ${number}`);
		});
		try {
			inOneStep();
		} catch (error) {
			const name = migration.constructor.name;
			const reason = String(error);
			throw new MigrationFailedError(
				`migration ${number}, ${name}, failed: ${reason}`,
			);
		}
	}

	private static versionOf(database: Database): number {
		const row = database.query("PRAGMA user_version").get() as {
			user_version: number;
		};
		return row.user_version;
	}
}
