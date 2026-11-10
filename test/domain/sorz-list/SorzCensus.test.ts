import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzCensus } from "../../../src/domain/sorz-list/SorzCensus.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("with no entries it has no sorzs", async () => {
	await sut.takeCensus();

	expect(sut.sorzs()).toEqual([]);
});

test("a sorz held by one user counts one user", async () => {
	await sut.hold("xaviuzz", "https://example.com");

	await sut.takeCensus();

	expect(sut.sorzs()).toEqual([
		{ address: "https://example.com", favicon: null, users: 1 },
	]);
});

test("a sorz held by two users counts two users", async () => {
	await sut.hold("xaviuzz", "https://example.com");
	await sut.hold("ana", "https://example.com");

	await sut.takeCensus();

	expect(sut.sorzs()).toEqual([
		{ address: "https://example.com", favicon: null, users: 2 },
	]);
});

test("each sorz is counted apart", async () => {
	await sut.hold("xaviuzz", "https://a.example.com");
	await sut.hold("xaviuzz", "https://b.example.com");
	await sut.hold("ana", "https://b.example.com");

	await sut.takeCensus();

	expect(sut.countsByAddress()).toEqual({
		"https://a.example.com": 1,
		"https://b.example.com": 2,
	});
});

test("the sorz brings its favicon", async () => {
	await sut.hold("xaviuzz", "https://example.com", "https://example.com/i.png");

	await sut.takeCensus();

	expect(sut.sorzs()).toEqual([
		{
			address: "https://example.com",
			favicon: "https://example.com/i.png",
			users: 1,
		},
	]);
});

test("sorzs come ordered by address ignoring letter case", async () => {
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

test("an address with a trailing slash is a sorz apart", async () => {
	await sut.hold("xaviuzz", "https://example.com");
	await sut.hold("ana", "https://example.com/");

	await sut.takeCensus();

	expect(sut.countsByAddress()).toEqual({
		"https://example.com": 1,
		"https://example.com/": 1,
	});
});

class SUT {
	private readonly repository = new InMemorySorzListRepository();
	private census = SorzCensus.of([]);

	async hold(owner: string, address: string, favicon?: string): Promise<void> {
		const pageInfo = this.pageInfoWith(favicon);
		const sorz = Sorz.register(SorzAddress.from(address), pageInfo);
		const entry = new SorzEntry(sorz, SorzName.none());
		await this.repository.add(Username.from(owner), entry);
	}

	async takeCensus(): Promise<void> {
		const lists = await this.repository.loadEveryList();
		this.census = SorzCensus.of(lists);
	}

	sorzs() {
		return this.census.toJSON().sorzs;
	}

	addresses(): string[] {
		return this.sorzs().map((sorz) => sorz.address);
	}

	countsByAddress(): Record<string, number> {
		const counts: Record<string, number> = {};
		for (const sorz of this.sorzs()) {
			counts[sorz.address] = sorz.users;
		}
		return counts;
	}

	private pageInfoWith(favicon?: string): PageInfo {
		let pageInfo = PageInfo.none();
		if (favicon) pageInfo = PageInfo.fromJSON({ title: null, favicon });
		return pageInfo;
	}
}
