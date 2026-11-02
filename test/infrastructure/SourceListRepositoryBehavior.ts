import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../src/domain/source/PageInfo.ts";
import { Source } from "../../src/domain/source/Source.ts";
import { SourceAddress } from "../../src/domain/source/SourceAddress.ts";
import { AddressAlreadyRegisteredError } from "../../src/domain/source-list/AddressAlreadyRegisteredError.ts";
import { NameTakenError } from "../../src/domain/source-list/NameTakenError.ts";
import { SourceEntry } from "../../src/domain/source-list/SourceEntry.ts";
import { SourceList } from "../../src/domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../src/domain/source-list/SourceListRepository.ts";
import { SourceName } from "../../src/domain/source-list/SourceName.ts";

export function behavesAsSourceListRepository(
	create: () => SourceListRepository,
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

	test("adding to a loaded list does not change what is kept", async () => {
		await sut.loadList();
		sut.addToLoaded("https://example.com", "Example")();

		await sut.loadList();

		expect(sut.names()).toEqual([]);
	});
}

class SUT {
	private loaded = new SourceList();

	constructor(private readonly repository: SourceListRepository) {}

	async loadList(): Promise<void> {
		this.loaded = await this.repository.load();
	}

	async addEntry(address: string, name: string): Promise<void> {
		const entry = this.entryFor(address, name);
		await this.repository.add(entry);
	}

	addToLoaded(address: string, name: string): () => void {
		const source = this.sourceFor(address);
		const adding = () => {
			this.loaded.add(source, SourceName.from(name));
		};
		return adding;
	}

	names(): (string | null)[] {
		const entries = this.loaded.entries();
		return entries.map((entry) => entry.toJSON().name);
	}

	private entryFor(address: string, name: string): SourceEntry {
		const source = this.sourceFor(address);
		const entry = new SourceEntry(source, SourceName.from(name));
		return entry;
	}

	private sourceFor(address: string): Source {
		const source = Source.register(
			SourceAddress.from(address),
			PageInfo.none(),
		);
		return source;
	}
}
