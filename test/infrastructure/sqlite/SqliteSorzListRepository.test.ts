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
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { SqliteSorzListRepository } from "../../../src/infrastructure/sqlite/SqliteSorzListRepository.ts";
import { UnreadableSorzListError } from "../../../src/infrastructure/sqlite/UnreadableSorzListError.ts";
import { behavesAsSorzListRepository } from "../SorzListRepositoryBehavior.ts";

behavesAsSorzListRepository(() => new SqliteSorzListRepository(":memory:"));

const xaviuzz = Username.from("xaviuzz");

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps the list when the file is opened again", async () => {
	const path = join(folder, "sorzs.db");
	const first = new SqliteSorzListRepository(path);
	await first.add(xaviuzz, entryFor("https://example.com", "Example"));

	const second = new SqliteSorzListRepository(path);
	const list = await second.load(xaviuzz);

	expect(list.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
});

test("keeps the list in sorzs.db inside a folder it creates when missing", async () => {
	const dataDir = join(folder, "nested", "data");
	const first = SqliteSorzListRepository.inFolder(dataDir);
	await first.add(xaviuzz, entryFor("https://example.com", "Example"));

	const second = SqliteSorzListRepository.inFolder(dataDir);
	const list = await second.load(xaviuzz);

	expect(list.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
	expect(existsSync(join(dataDir, "sorzs.db"))).toBe(true);
});

test("entries saved before there were owners belong to xaviuzz", async () => {
	const path = join(folder, "sorzs.db");
	saveWithoutOwner(path, entryFor("https://example.com", "Example"));

	const repository = new SqliteSorzListRepository(path);
	const ofXaviuzz = await repository.load(xaviuzz);
	const ofAna = await repository.load(Username.from("ana"));

	expect(ofXaviuzz.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
	expect(ofAna.entries()).toEqual([]);
});

test("entries saved with the old identifier key are read under the new one", async () => {
	const path = join(folder, "sorzs.db");
	saveWithOldIdentifier(path, "https://example.com", "Example");

	const repository = new SqliteSorzListRepository(path);
	const list = await repository.load(xaviuzz);

	const [entry] = list.entries();
	expect(entry.toJSON().sorzId).toBe("old-id");
	expect(entry.toJSON().name).toBe("Example");
});

test("rewrites the old identifier key once, so reopening keeps the same entries", async () => {
	const path = join(folder, "sorzs.db");
	saveWithOldIdentifier(path, "https://example.com", "Example");
	new SqliteSorzListRepository(path);

	const reopened = new SqliteSorzListRepository(path);
	const list = await reopened.load(xaviuzz);

	expect(list.entries().map((entry) => entry.toJSON().sorzId)).toEqual([
		"old-id",
	]);
});

test("a file that is not a database stops the opening and stays as it was", () => {
	const path = join(folder, "sorzs.db");
	writeFileSync(path, "this is not a database, it is long enough to be read");
	const before = readFileSync(path);

	const opening = () => new SqliteSorzListRepository(path);

	expect(opening).toThrow(UnreadableSorzListError);
	expect(readFileSync(path)).toEqual(before);
});

function saveWithOldIdentifier(
	path: string,
	address: string,
	name: string,
): void {
	const database = new Database(path);
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL, owner TEXT NOT NULL DEFAULT 'xaviuzz')",
	);
	const document = JSON.stringify({
		sourceId: "old-id",
		name,
		address,
		title: null,
		favicon: null,
	});
	database.run("INSERT INTO entries (document) VALUES (?)", [document]);
	database.close();
}

function saveWithoutOwner(path: string, entry: SorzEntry): void {
	const database = new Database(path);
	database.run(
		"CREATE TABLE entries (position INTEGER PRIMARY KEY AUTOINCREMENT, document TEXT NOT NULL)",
	);
	database.run("INSERT INTO entries (document) VALUES (?)", [
		JSON.stringify(entry),
	]);
	database.close();
}

function entryFor(address: string, name: string): SorzEntry {
	const sorz = Sorz.register(SorzAddress.from(address), PageInfo.none());
	return new SorzEntry(sorz, SorzName.from(name));
}
