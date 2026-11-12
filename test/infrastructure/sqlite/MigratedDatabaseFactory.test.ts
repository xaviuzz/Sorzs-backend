import { Database } from "bun:sqlite";
import { afterEach, beforeEach, expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MigratedDatabaseFactory } from "../../../src/infrastructure/sqlite/MigratedDatabaseFactory.ts";
import { NewerDatabaseError } from "../../../src/infrastructure/sqlite/migrations/NewerDatabaseError.ts";
import { UnreadableDatabaseError } from "../../../src/infrastructure/sqlite/UnreadableDatabaseError.ts";

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps the data in sorzs.db inside a folder it creates when missing", () => {
	const dataDir = join(folder, "nested", "data");
	const first = MigratedDatabaseFactory.standard().inFolder(dataDir);
	first.run(
		"INSERT INTO users (username, hash, role) VALUES ('a', 'h', 'user')",
	);
	first.close();

	const second = MigratedDatabaseFactory.standard().inFolder(dataDir);
	const rows = second.query("SELECT username FROM users").all();

	expect(rows).toHaveLength(1);
	expect(existsSync(join(dataDir, "sorzs.db"))).toBe(true);
});

test("a file that is not a database stops the opening and stays as it was", () => {
	const path = join(folder, "sorzs.db");
	writeFileSync(path, "this is not a database, it is long enough to be read");
	const before = readFileSync(path);

	const opening = () => MigratedDatabaseFactory.standard().inFolder(folder);

	expect(opening).toThrow(UnreadableDatabaseError);
	expect(readFileSync(path)).toEqual(before);
});

test("a database newer than the application stops the opening and stays as it was", () => {
	const path = join(folder, "sorzs.db");
	const newer = new Database(path);
	newer.run("PRAGMA user_version = 99");
	newer.close();
	const before = readFileSync(path);

	const opening = () => MigratedDatabaseFactory.standard().inFolder(folder);

	expect(opening).toThrow(NewerDatabaseError);
	expect(readFileSync(path)).toEqual(before);
});
