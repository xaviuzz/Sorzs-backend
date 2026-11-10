import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../src/domain/sorz/PageInfo.ts";
import { Sorz } from "../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../src/domain/sorz/SorzAddress.ts";
import { AddressAlreadyRegisteredError } from "../../src/domain/sorz-list/AddressAlreadyRegisteredError.ts";
import { NameTakenError } from "../../src/domain/sorz-list/NameTakenError.ts";
import { SorzEntry } from "../../src/domain/sorz-list/SorzEntry.ts";
import { SorzList } from "../../src/domain/sorz-list/SorzList.ts";
import type { SorzListRepository } from "../../src/domain/sorz-list/SorzListRepository.ts";
import { SorzName } from "../../src/domain/sorz-list/SorzName.ts";
import { Username } from "../../src/domain/user/Username.ts";

export function behavesAsSorzListRepository(
	create: () => SorzListRepository,
): void {
	let sut: SUT;

	beforeEach(() => {
		sut = new SUT(create());
	});

	test("starts with an empty list", async () => {
		await sut.loadList();

		expect(sut.names()).toEqual([]);
	});

	test("an added entry is loaded again", async () => {
		await sut.addEntry("https://example.com", "Example");

		await sut.loadList();

		expect(sut.names()).toEqual(["Example"]);
	});

	test("entries come back in the order they were added", async () => {
		await sut.addEntry("https://b.example.com", "Second letter");
		await sut.addEntry("https://a.example.com", "First letter");

		await sut.loadList();

		expect(sut.names()).toEqual(["Second letter", "First letter"]);
	});

	test("a loaded list refuses an address already added", async () => {
		await sut.addEntry("https://example.com", "Example");
		await sut.loadList();

		const adding = sut.addToLoaded("https://example.com", "Other");

		expect(adding).toThrow(AddressAlreadyRegisteredError);
	});

	test("a loaded list refuses a name already added", async () => {
		await sut.addEntry("https://example.com", "Example");
		await sut.loadList();

		const adding = sut.addToLoaded("https://other.example.com", "example");

		expect(adding).toThrow(NameTakenError);
	});

	test("each user has a list of their own", async () => {
		await sut.addEntry("https://example.com", "Example");

		await sut.loadListOf("ana");

		expect(sut.names()).toEqual([]);
	});

	test("entries stay in the order they were added within each user's list", async () => {
		await sut.addEntry("https://a.example.com", "First of xaviuzz");
		await sut.addEntryOf("ana", "https://b.example.com", "First of ana");
		await sut.addEntry("https://c.example.com", "Second of xaviuzz");
		await sut.addEntryOf("ana", "https://d.example.com", "Second of ana");

		await sut.loadListOf("ana");

		expect(sut.names()).toEqual(["First of ana", "Second of ana"]);
	});

	test("the same address can be in two users' lists", async () => {
		await sut.addEntry("https://example.com", "Example");
		await sut.loadListOf("ana");

		const adding = sut.addToLoaded("https://example.com", "Example");

		expect(adding).not.toThrow();
	});

	test("hands over no list when nothing was added", async () => {
		await sut.loadEveryList();

		expect(sut.namesOfEveryList()).toEqual([]);
	});

	test("hands over the list of every owner", async () => {
		await sut.addEntry("https://a.example.com", "First of xaviuzz");
		await sut.addEntryOf("ana", "https://b.example.com", "First of ana");
		await sut.addEntry("https://c.example.com", "Second of xaviuzz");

		await sut.loadEveryList();

		expect(sut.namesOfEveryList()).toEqual([
			["First of ana"],
			["First of xaviuzz", "Second of xaviuzz"],
		]);
	});

	test("adding to a loaded list does not change what is kept", async () => {
		await sut.loadList();
		sut.addToLoaded("https://example.com", "Example")();

		await sut.loadList();

		expect(sut.names()).toEqual([]);
	});
}

class SUT {
	private loaded = new SorzList();
	private everyList: SorzList[] = [];

	constructor(private readonly repository: SorzListRepository) {}

	async loadEveryList(): Promise<void> {
		this.everyList = await this.repository.loadEveryList();
	}

	namesOfEveryList(): (string | null)[][] {
		const namesOfEach: (string | null)[][] = [];
		for (const list of this.everyList) {
			const names = list.entries().map((entry) => entry.toJSON().name);
			namesOfEach.push(names);
		}
		const sorted = namesOfEach.sort((one, other) =>
			String(one[0]).localeCompare(String(other[0])),
		);
		return sorted;
	}

	async loadList(): Promise<void> {
		await this.loadListOf("xaviuzz");
	}

	async loadListOf(owner: string): Promise<void> {
		this.loaded = await this.repository.load(Username.from(owner));
	}

	async addEntry(address: string, name: string): Promise<void> {
		await this.addEntryOf("xaviuzz", address, name);
	}

	async addEntryOf(
		owner: string,
		address: string,
		name: string,
	): Promise<void> {
		const entry = this.entryFor(address, name);
		await this.repository.add(Username.from(owner), entry);
	}

	addToLoaded(address: string, name: string): () => void {
		const sorz = this.sorzFor(address);
		const adding = () => {
			this.loaded.add(sorz, SorzName.from(name));
		};
		return adding;
	}

	names(): (string | null)[] {
		const entries = this.loaded.entries();
		return entries.map((entry) => entry.toJSON().name);
	}

	private entryFor(address: string, name: string): SorzEntry {
		const sorz = this.sorzFor(address);
		const entry = new SorzEntry(sorz, SorzName.from(name));
		return entry;
	}

	private sorzFor(address: string): Sorz {
		const sorz = Sorz.register(SorzAddress.from(address), PageInfo.none());
		return sorz;
	}
}
