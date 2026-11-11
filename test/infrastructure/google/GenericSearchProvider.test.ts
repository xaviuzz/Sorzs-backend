import { beforeEach, expect, test } from "bun:test";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
import { GenericSearchProvider } from "../../../src/infrastructure/google/GenericSearchProvider.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("can search any sorz", () => {
	expect(sut.canSearch("https://example.com")).toBe(true);
	expect(sut.canSearch("https://www.reddit.com/r/spain")).toBe(true);
});

test("the title tells to search on Google", async () => {
	const result = await sut.search("https://example.com", "rust");

	expect(result.title).toBe("Search it on Google");
});

test("the link asks Google for the query limited to the site", async () => {
	const result = await sut.search("https://example.com", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com",
	);
});

test("the description names the query and the site", async () => {
	const result = await sut.search("https://example.com", "rust");

	expect(result.description).toBe(
		"Google search for «rust» limited to example.com",
	);
});

test("the query is encoded in the link", async () => {
	const result = await sut.search("https://example.com", "rust & go?");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20%26%20go%3F%20site:example.com",
	);
});

test("the path of the sorz is kept", async () => {
	const result = await sut.search("https://example.com/docs/api", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs/api",
	);
	expect(result.description).toBe(
		"Google search for «rust» limited to example.com/docs/api",
	);
});

test("the final slash of the sorz is dropped", async () => {
	const result = await sut.search("https://example.com/docs/", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs",
	);
});

test("the root slash of the sorz is dropped", async () => {
	const result = await sut.search("https://example.com/", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com",
	);
});

test("the port of the sorz is kept", async () => {
	const result = await sut.search("http://localhost:8080/docs", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:localhost:8080/docs",
	);
});

test("a question or a fragment in the sorz address is not part of the site", async () => {
	const result = await sut.search(
		"https://example.com/docs?lang=es#top",
		"rust",
	);

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs",
	);
});

test("the result comes from the sorz by its display name", async () => {
	const result = await sut.searchNamed(
		"https://example.com",
		"My docs",
		"rust",
	);

	expect(result.sorz).toBe("My docs");
});

class SUT {
	private readonly searcher = new GenericSearchProvider();

	canSearch(address: string): boolean {
		const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
		const sorz = Sorz.register(SorzAddress.from(address), info);
		const entry = new SorzEntry(sorz, SorzName.fromOptional(""));
		return this.searcher.canSearch(entry);
	}

	async search(address: string, query: string) {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(address: string, name: string, query: string) {
		const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
		const sorz = Sorz.register(SorzAddress.from(address), info);
		const entry = new SorzEntry(sorz, SorzName.fromOptional(name));
		const result = await this.searcher.search(entry, SearchQuery.from(query));
		return result.toJSON();
	}
}
