import type { SourceEntry } from "../source-list/SourceEntry.ts";
import type { SearchQuery } from "./SearchQuery.ts";
import type { SearchResult } from "./SearchResult.ts";

export interface SourceSearch {
	search(entry: SourceEntry, query: SearchQuery): Promise<SearchResult>;
}
