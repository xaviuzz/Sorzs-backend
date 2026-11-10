import type { SorzEntry } from "../sorz-list/SorzEntry.ts";
import type { SearchQuery } from "./SearchQuery.ts";
import type { SearchResult } from "./SearchResult.ts";

export interface SorzSearch {
	search(entry: SorzEntry, query: SearchQuery): Promise<SearchResult>;
}
