import type { SorzEntry } from "../sorz-list/SorzEntry.ts";
import type { SearchProvider } from "./SearchProvider.ts";
import type { SearchQuery } from "./SearchQuery.ts";
import type { SearchResult } from "./SearchResult.ts";

export class SearchProviders {
	constructor(
		private readonly specialists: SearchProvider[],
		private readonly catchAll: SearchProvider,
	) {}

	search(entry: SorzEntry, query: SearchQuery): Promise<SearchResult> {
		const provider = this.providerFor(entry);
		return provider.search(entry, query);
	}

	private providerFor(entry: SorzEntry): SearchProvider {
		let chosen = this.catchAll;
		for (const provider of [...this.specialists].reverse())
			if (provider.canSearch(entry)) chosen = provider;
		return chosen;
	}
}
