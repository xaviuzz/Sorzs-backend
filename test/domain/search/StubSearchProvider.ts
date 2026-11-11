import type { SearchProvider } from "../../../src/domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import type { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";

export class StubSearchProvider implements SearchProvider {
	private constructor(
		private readonly title: string,
		private readonly site: string,
		private readonly searchesAnything: boolean,
	) {}

	static that(title: string, address: string): StubSearchProvider {
		const site = new URL(address).host;
		return new StubSearchProvider(title, site, false);
	}

	static thatSearchesAnything(title: string): StubSearchProvider {
		return new StubSearchProvider(title, "", true);
	}

	canSearch(entry: SorzEntry): boolean {
		const isTheSite = entry.site() === this.site;
		const canSearch = this.searchesAnything || isTheSite;
		return canSearch;
	}

	async search(entry: SorzEntry, _query: SearchQuery): Promise<SearchResult> {
		return new SearchResult(this.title, "link", "", entry.displayName());
	}
}
