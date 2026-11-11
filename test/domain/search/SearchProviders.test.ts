import { expect, test } from "bun:test";
import { SearchProviders } from "../../../src/domain/search/SearchProviders.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
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

class SUT {
	static providing(...specialists: StubSearchProvider[]): SUT {
		const catchAll = StubSearchProvider.thatSearchesAnything("catch-all");
		return new SUT(new SearchProviders(specialists, catchAll));
	}

	private constructor(private readonly providers: SearchProviders) {}

	async titleFor(address: string): Promise<string> {
		const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
		const sorz = Sorz.register(SorzAddress.from(address), info);
		const entry = new SorzEntry(sorz, SorzName.fromOptional(""));
		const result = await this.providers.search(entry, SearchQuery.from("q"));
		return result.toJSON().title;
	}
}
