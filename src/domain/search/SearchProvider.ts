import type { SorzEntry } from "../sorz-list/SorzEntry.ts";
import type { ProviderId } from "./ProviderId.ts";
import type { SearchQuery } from "./SearchQuery.ts";
import type { SearchResults } from "./SearchResults.ts";

export interface SearchProvider {
	id(): ProviderId;
	canSearch(entry: SorzEntry): boolean;
	search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults>;
}
