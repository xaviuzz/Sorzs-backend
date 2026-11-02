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
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";
import { SqliteSourceListRepository } from "../../../src/infrastructure/sqlite/SqliteSourceListRepository.ts";
import { UnreadableSourceListError } from "../../../src/infrastructure/sqlite/UnreadableSourceListError.ts";
import { behavesAsSourceListRepository } from "../SourceListRepositoryBehavior.ts";

behavesAsSourceListRepository(() => new SqliteSourceListRepository(":memory:"));

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps the list when the file is opened again", async () => {
	const path = join(folder, "sorzs.db");
	const first = new SqliteSourceListRepository(path);
	await first.add(entryFor("https://example.com", "Example"));

	const second = new SqliteSourceListRepository(path);
	const list = await second.load();

	expect(list.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
});

test("keeps the list in sorzs.db inside a folder it creates when missing", async () => {
	const dataDir = join(folder, "nested", "data");
	const first = SqliteSourceListRepository.inFolder(dataDir);
	await first.add(entryFor("https://example.com", "Example"));

	const second = SqliteSourceListRepository.inFolder(dataDir);
	const list = await second.load();

	expect(list.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
	expect(existsSync(join(dataDir, "sorzs.db"))).toBe(true);
});

test("a file that is not a database stops the opening and stays as it was", () => {
	const path = join(folder, "sorzs.db");
	writeFileSync(path, "this is not a database, it is long enough to be read");
	const before = readFileSync(path);

	const opening = () => new SqliteSourceListRepository(path);

	expect(opening).toThrow(UnreadableSourceListError);
	expect(readFileSync(path)).toEqual(before);
});

function entryFor(address: string, name: string): SourceEntry {
	const source = Source.register(SourceAddress.from(address), PageInfo.none());
	return new SourceEntry(source, SourceName.from(name));
}
