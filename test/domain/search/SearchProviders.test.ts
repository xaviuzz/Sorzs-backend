import { expect, test } from "bun:test";
import { SearchProviders } from "../../../src/domain/search/SearchProviders.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { entryAt } from "../sorz-list/EntryAt.ts";
import { StubSearchProvider } from "./StubSearchProvider.ts";

test("the first provider that can search the sorz answers", async () => {
	const sut = SUT.providing(
		StubSearchProvider.that("first", "https://a.com"),
		StubSearchProvider.that("second", "https://a.com"),
	);

	const title = await sut.titleFor("https://a.com");

	expect(title).toBe("first");
});

test("a provider that cannot search the sorz is skipped", async () => {
	const sut = SUT.providing(
		StubSearchProvider.that("for a", "https://a.com"),
		StubSearchProvider.that("for b", "https://b.com"),
	);

	const title = await sut.titleFor("https://b.com");

	expect(title).toBe("for b");
});

test("the catch-all answers when no provider can search the sorz", async () => {
	const sut = SUT.providing(StubSearchProvider.that("for a", "https://a.com"));

	const title = await sut.titleFor("https://other.com");

	expect(title).toBe("catch-all");
});

test("names the specialist that can search the sorz", () => {
	const sut = SUT.providing(StubSearchProvider.that("for a", "https://a.com"));

	const id = sut.idFor("https://a.com");

	expect(id).toBe("reddit");
});

test("names the generic provider when no specialist can search the sorz", () => {
	const sut = SUT.providing(StubSearchProvider.that("for a", "https://a.com"));

	const id = sut.idFor("https://other.com");

	expect(id).toBe("generic");
});

class SUT {
	static providing(...specialists: StubSearchProvider[]): SUT {
		const catchAll = StubSearchProvider.thatSearchesAnything("catch-all");
		return new SUT(new SearchProviders(specialists, catchAll));
	}

	private constructor(private readonly providers: SearchProviders) {}

	async titleFor(address: string): Promise<string> {
		const entry = entryAt(address);
		const results = await this.providers.search(entry, SearchQuery.from("q"));
		return results.toJSON()[0].title;
	}

	idFor(address: string): string {
		const entry = entryAt(address);
		return this.providers.describedFor(entry).toJSON().provider;
	}
}
