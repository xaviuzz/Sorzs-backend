import { beforeEach, expect, test } from "bun:test";
import { DomainQualificationStrategy } from "../../../src/domain/search/DomainQualificationStrategy.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import type { SearchResults } from "../../../src/domain/search/SearchResults.ts";
import { RedditSearchProvider } from "../../../src/infrastructure/reddit/RedditSearchProvider.ts";
import { entryAt } from "../../domain/sorz-list/EntryAt.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("can search what its qualification accepts", () => {
	expect(sut.canSearch("https://www.reddit.com/r/spain")).toBe(true);
});

test("cannot search what its qualification refuses", () => {
	expect(sut.canSearch("https://example.com")).toBe(false);
});

test("the title tells to search on Reddit", async () => {
	const result = await sut.search("https://www.reddit.com", "rust");

	expect(result.title).toBe("Search it on Reddit");
});

test("the link asks Reddit for the query", async () => {
	const result = await sut.search("https://www.reddit.com", "rust");

	expect(result.url).toBe("https://www.reddit.com/search/?q=rust");
});

test("the spaces of the query become plus signs", async () => {
	const result = await sut.search("https://www.reddit.com", "beautifull women");

	expect(result.url).toBe("https://www.reddit.com/search/?q=beautifull+women");
});

test("the other characters of the query are encoded", async () => {
	const result = await sut.search("https://www.reddit.com", "café & té");

	expect(result.url).toBe(
		"https://www.reddit.com/search/?q=caf%C3%A9+%26+t%C3%A9",
	);
});

test("the path of the sorz does not limit the search", async () => {
	const result = await sut.search("https://www.reddit.com/r/spain", "rust");

	expect(result.url).toBe("https://www.reddit.com/search/?q=rust");
});

test("the description names the query", async () => {
	const result = await sut.search("https://www.reddit.com", "rust");

	expect(result.description).toBe("Reddit search for «rust»");
});

test("the result comes from the sorz by its display name", async () => {
	const result = await sut.searchNamed(
		"https://www.reddit.com",
		"Spain talk",
		"rust",
	);

	expect(result.sorz).toBe("Spain talk");
});

class SUT {
	private readonly provider = new RedditSearchProvider(
		new DomainQualificationStrategy("reddit.com"),
	);

	canSearch(address: string): boolean {
		return this.provider.canSearch(entryAt(address));
	}

	async search(address: string, query: string) {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(address: string, name: string, query: string) {
		const entry = entryAt(address, name);
		const results = await this.provider.search(entry, SearchQuery.from(query));
		return this.onlyResult(results);
	}

	private onlyResult(results: SearchResults) {
		return results.toJSON()[0];
	}
}
