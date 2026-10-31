import { beforeEach, expect, test } from "bun:test";
import { Source } from "../../src/domain/source/Source.ts";
import { SourceAddress } from "../../src/domain/source/SourceAddress.ts";
import { SourceList } from "../../src/domain/source-list/SourceList.ts";
import { SourceName } from "../../src/domain/source-list/SourceName.ts";
import { InMemorySourceListRepository } from "../../src/infrastructure/InMemorySourceListRepository.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("starts with an empty list", async () => {
	await sut.loadList();

	expect(sut.names()).toEqual([]);
});

test("a saved list is loaded again", async () => {
	await sut.saveListWith("https://example.com", "Example");

	await sut.loadList();

	expect(sut.names()).toEqual(["Example"]);
});

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private loaded = new SourceList();

	async loadList(): Promise<void> {
		this.loaded = await this.repository.load();
	}

	async saveListWith(address: string, name: string): Promise<void> {
		const list = new SourceList();
		const source = Source.register(SourceAddress.from(address));
		list.add(source, SourceName.from(name));
		await this.repository.save(list);
	}

	names(): string[] {
		const entries = this.loaded.entries();
		return entries.map((entry) => entry.toJSON().name);
	}
}
