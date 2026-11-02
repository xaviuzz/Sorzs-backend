import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResult } from "../../domain/search/SearchResult.ts";
import type { SourceSearch } from "../../domain/search/SourceSearch.ts";
import type { SourceEntry } from "../../domain/source-list/SourceEntry.ts";

const TITLE = "Search it on Google";
const GOOGLE_SEARCH = "https://www.google.com/search";

export class GoogleLinkSearch implements SourceSearch {
	async search(entry: SourceEntry, query: SearchQuery): Promise<SearchResult> {
		const site = entry.site();
		const text = query.toString();
		const url = this.linkFor(text, site);
		const description = `Google search for «${text}» limited to ${site}`;
		const source = entry.displayName();
		return new SearchResult(TITLE, url, description, source);
	}

	private linkFor(text: string, site: string): string {
		const encodedQuery = encodeURIComponent(text);
		const link = `${GOOGLE_SEARCH}?q=${encodedQuery}%20site:${site}`;
		return link;
	}
}
