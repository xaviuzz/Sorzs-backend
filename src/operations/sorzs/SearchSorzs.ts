import type { Call } from "../../call/Call.ts";
import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { SearchQuery } from "../../domain/search/SearchQuery.ts";
import type { SearchResult } from "../../domain/search/SearchResult.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class SearchSorzs implements OwnedHandler {
	readonly name = "sorzs.search";

	constructor(
		private readonly repository: SorzListRepository,
		private readonly providers: SearchProviders,
	) {}

	async execute(call: Call, owner: Username): Promise<unknown> {
		const query = SearchQuery.from(call.body.requireText("query"));
		const list = await this.repository.load(owner);
		const answers = await this.searchAll(list.entries(), query);
		const results = this.merge(answers);
		return { results: results.toJSON() };
	}

	private searchAll(
		entries: SorzEntry[],
		query: SearchQuery,
	): Promise<SearchResult[]> {
		const searches = entries.map((entry) =>
			this.providers.search(entry, query),
		);
		return Promise.all(searches);
	}

	private merge(answers: SearchResult[]): SearchResults {
		let results = SearchResults.none();
		for (const answer of answers) results = results.with(answer);
		return results;
	}
}
