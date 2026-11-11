import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResult } from "../../domain/search/SearchResult.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";

const TITLE = "Search it on Reddit";
const REDDIT_SEARCH = "https://www.reddit.com/search/";

export class RedditSearchProvider implements SearchProvider {
	constructor(private readonly qualification: QualificationStrategy) {}

	canSearch(entry: SorzEntry): boolean {
		return this.qualification.qualifies(entry);
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResult> {
		const text = query.toString();
		const url = this.linkFor(text);
		const description = `Reddit search for «${text}»`;
		const sorz = entry.displayName();
		return new SearchResult(TITLE, url, description, sorz);
	}

	private linkFor(text: string): string {
		const encodedQuery = encodeURIComponent(text);
		const spacedQuery = encodedQuery.replaceAll("%20", "+");
		const link = `${REDDIT_SEARCH}?q=${spacedQuery}`;
		return link;
	}
}
