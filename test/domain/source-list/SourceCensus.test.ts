import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { SourceCensus } from "../../../src/domain/source-list/SourceCensus.ts";
import { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("with no entries it has no sources", async () => {
	await sut.takeCensus();

	expect(sut.sources()).toEqual([]);
});

test("a source held by one user counts one user", async () => {
	await sut.hold("xaviuzz", "https://example.com");

	await sut.takeCensus();

	expect(sut.sources()).toEqual([
		{ address: "https://example.com", favicon: null, users: 1 },
	]);
});

test("a source held by two users counts two users", async () => {
	await sut.hold("xaviuzz", "https://example.com");
	await sut.hold("ana", "https://example.com");

	await sut.takeCensus();

	expect(sut.sources()).toEqual([
		{ address: "https://example.com", favicon: null, users: 2 },
	]);
});

test("each source is counted apart", async () => {
	await sut.hold("xaviuzz", "https://a.example.com");
	await sut.hold("xaviuzz", "https://b.example.com");
	await sut.hold("ana", "https://b.example.com");

	await sut.takeCensus();

	expect(sut.countsByAddress()).toEqual({
		"https://a.example.com": 1,
		"https://b.example.com": 2,
	});
});

test("the source brings its favicon", async () => {
	await sut.hold("xaviuzz", "https://example.com", "https://example.com/i.png");

	await sut.takeCensus();

	expect(sut.sources()).toEqual([
		{
			address: "https://example.com",
			favicon: "https://example.com/i.png",
			users: 1,
		},
	]);
});

test("sources come ordered by address ignoring letter case", async () => {
	await sut.hold("xaviuzz", "https://b.example.com");
	await sut.hold("xaviuzz", "https://A.example.com");
	await sut.hold("xaviuzz", "https://c.example.com");

	await sut.takeCensus();

	expect(sut.addresses()).toEqual([
		"https://A.example.com",
		"https://b.example.com",
		"https://c.example.com",
	]);
});

test("an http address comes before the https one of the same site", async () => {
	await sut.hold("xaviuzz", "https://example.com");
	await sut.hold("xaviuzz", "http://example.com");

	await sut.takeCensus();

	expect(sut.addresses()).toEqual([
		"http://example.com",
		"https://example.com",
	]);
});

test("an address with a trailing slash is a source apart", async () => {
	await sut.hold("xaviuzz", "https://example.com");
	await sut.hold("ana", "https://example.com/");

	await sut.takeCensus();

	expect(sut.countsByAddress()).toEqual({
		"https://example.com": 1,
		"https://example.com/": 1,
	});
});

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private census = SourceCensus.of([]);

	async hold(owner: string, address: string, favicon?: string): Promise<void> {
		const pageInfo = this.pageInfoWith(favicon);
		const source = Source.register(SourceAddress.from(address), pageInfo);
		const entry = new SourceEntry(source, SourceName.none());
		await this.repository.add(Username.from(owner), entry);
	}

	async takeCensus(): Promise<void> {
		const lists = await this.repository.loadEveryList();
		this.census = SourceCensus.of(lists);
	}

	sources() {
		return this.census.toJSON().sources;
	}

	addresses(): string[] {
		return this.sources().map((source) => source.address);
	}

	countsByAddress(): Record<string, number> {
		const counts: Record<string, number> = {};
		for (const source of this.sources()) {
			counts[source.address] = source.users;
		}
		return counts;
	}

	private pageInfoWith(favicon?: string): PageInfo {
		let pageInfo = PageInfo.none();
		if (favicon) pageInfo = PageInfo.fromJSON({ title: null, favicon });
		return pageInfo;
	}
}
