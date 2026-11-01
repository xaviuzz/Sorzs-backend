import type { Call } from "../../call/Call.ts";
import { SearchQuery } from "../../domain/search/SearchQuery.ts";
import type { SearchResult } from "../../domain/search/SearchResult.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import type { SourceSearch } from "../../domain/search/SourceSearch.ts";
import type { SourceEntry } from "../../domain/source-list/SourceEntry.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class SearchSources implements JsonHandler {
	readonly name = "sources.search";

	constructor(
		private readonly repository: SourceListRepository,
		private readonly search: SourceSearch,
	) {}

	async execute(call: Call): Promise<unknown> {
		const query = SearchQuery.from(call.body.requireText("query"));
		const list = await this.repository.load();
		const answers = await this.searchAll(list.entries(), query);
		const results = this.merge(answers);
		return { results: results.toJSON() };
	}

	private searchAll(
		entries: SourceEntry[],
		query: SearchQuery,
	): Promise<SearchResult[]> {
		const searches = entries.map((entry) => this.search.search(entry, query));
		return Promise.all(searches);
	}

	private merge(answers: SearchResult[]): SearchResults {
		let results = SearchResults.none();
		for (const answer of answers) results = results.with(answer);
		return results;
	}
}
