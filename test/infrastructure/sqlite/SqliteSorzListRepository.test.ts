import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { MigratedDatabaseFactory } from "../../../src/infrastructure/sqlite/MigratedDatabaseFactory.ts";
import { SqliteSorzListRepository } from "../../../src/infrastructure/sqlite/SqliteSorzListRepository.ts";
import { behavesAsSorzListRepository } from "../SorzListRepositoryBehavior.ts";

behavesAsSorzListRepository(
	() =>
		new SqliteSorzListRepository(MigratedDatabaseFactory.standard().inMemory()),
);

const xaviuzz = Username.from("xaviuzz");

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps the list when the file is opened again", async () => {
	const first = new SqliteSorzListRepository(
		MigratedDatabaseFactory.standard().inFolder(folder),
	);
	await first.add(xaviuzz, entryFor("https://example.com", "Example"));

	const second = new SqliteSorzListRepository(
		MigratedDatabaseFactory.standard().inFolder(folder),
	);
	const list = await second.load(xaviuzz);

	expect(list.entries().map((entry) => entry.toJSON().name)).toEqual([
		"Example",
	]);
});

function entryFor(address: string, name: string): SorzEntry {
	const sorz = Sorz.register(SorzAddress.from(address), PageInfo.none());
	return new SorzEntry(sorz, SorzName.from(name));
}
