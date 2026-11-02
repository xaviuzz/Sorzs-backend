import { beforeEach, expect, test } from "bun:test";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";
import { GoogleLinkSearch } from "../../../src/infrastructure/google/GoogleLinkSearch.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
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

test("the path of the source is kept", async () => {
	const result = await sut.search("https://example.com/docs/api", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs/api",
	);
	expect(result.description).toBe(
		"Google search for «rust» limited to example.com/docs/api",
	);
});

test("the final slash of the source is dropped", async () => {
	const result = await sut.search("https://example.com/docs/", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs",
	);
});

test("the root slash of the source is dropped", async () => {
	const result = await sut.search("https://example.com/", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com",
	);
});

test("the port of the source is kept", async () => {
	const result = await sut.search("http://localhost:8080/docs", "rust");

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:localhost:8080/docs",
	);
});

test("a question or a fragment in the source address is not part of the site", async () => {
	const result = await sut.search(
		"https://example.com/docs?lang=es#top",
		"rust",
	);

	expect(result.url).toBe(
		"https://www.google.com/search?q=rust%20site:example.com/docs",
	);
});

test("the result comes from the source by its display name", async () => {
	const result = await sut.searchNamed(
		"https://example.com",
		"My docs",
		"rust",
	);

	expect(result.source).toBe("My docs");
});

class SUT {
	private readonly searcher = new GoogleLinkSearch();

	async search(address: string, query: string) {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(address: string, name: string, query: string) {
		const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
		const source = Source.register(SourceAddress.from(address), info);
		const entry = new SourceEntry(source, SourceName.fromOptional(name));
		const result = await this.searcher.search(entry, SearchQuery.from(query));
		return result.toJSON();
	}
}
