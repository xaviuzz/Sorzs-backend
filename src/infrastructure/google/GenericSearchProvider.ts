import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResult } from "../../domain/search/SearchResult.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";

const TITLE = "Search it on Google";
const GOOGLE_SEARCH = "https://www.google.com/search";

export class GenericSearchProvider implements SearchProvider {
	id(): ProviderId {
		return ProviderId.generic();
	}

	canSearch(_entry: SorzEntry): boolean {
		return true;
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResult> {
		const site = entry.site();
		const text = query.toString();
		const url = this.linkFor(text, site);
		const description = `Google search for «${text}» limited to ${site}`;
		const sorz = entry.displayName();
		return new SearchResult(TITLE, url, description, sorz);
	}

	private linkFor(text: string, site: string): string {
		const encodedQuery = encodeURIComponent(text);
		const link = `${GOOGLE_SEARCH}?q=${encodedQuery}%20site:${site}`;
		return link;
	}
}
