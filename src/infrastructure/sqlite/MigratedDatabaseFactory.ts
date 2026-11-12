import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Migrations } from "./migrations/Migrations.ts";
import { UnreadableDatabaseError } from "./UnreadableDatabaseError.ts";

export class MigratedDatabaseFactory {
	constructor(private readonly migrations: Migrations) {}

	static standard(): MigratedDatabaseFactory {
		return new MigratedDatabaseFactory(Migrations.standard());
	}

	inFolder(folder: string): Database {
		mkdirSync(folder, { recursive: true });
		const path = join(folder, "sorzs.db");
		return this.open(path);
	}

	inMemory(): Database {
		return this.open(":memory:");
	}

	private open(path: string): Database {
		const database = MigratedDatabaseFactory.connect(path);
		this.migrations.apply(database);
		return database;
	}

	private static connect(path: string): Database {
		try {
			const database = new Database(path);
			database.query("PRAGMA schema_version").get();
			return database;
		} catch (error) {
			const reason = String(error);
			throw new UnreadableDatabaseError(
				`the saved data at ${path} cannot be read: ${reason}`,
			);
		}
	}
}
