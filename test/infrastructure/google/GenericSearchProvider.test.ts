import { beforeEach, expect, test } from "bun:test";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import type { SearchResults } from "../../../src/domain/search/SearchResults.ts";
import { GenericSearchProvider } from "../../../src/infrastructure/google/GenericSearchProvider.ts";
import { entryAt } from "../../domain/sorz-list/EntryAt.ts";

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
		return this.searcher.canSearch(entryAt(address));
	}

	async search(address: string, query: string) {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(address: string, name: string, query: string) {
		const entry = entryAt(address, name);
		const results = await this.searcher.search(entry, SearchQuery.from(query));
		return this.onlyResult(results);
	}

	private onlyResult(results: SearchResults) {
		return results.toJSON()[0];
	}
}
