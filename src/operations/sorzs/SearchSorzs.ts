import type { Call } from "../../call/Call.ts";
import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";
import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchReport } from "../../domain/search/SearchReport.ts";
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
		const report = this.merge(answers);
		return report.toJSON();
	}

	private searchAll(
		entries: SorzEntry[],
		query: SearchQuery,
	): Promise<SearchReport[]> {
		const searches = entries.map((entry) => this.searchOne(entry, query));
		return Promise.all(searches);
	}

	private async searchOne(
		entry: SorzEntry,
		query: SearchQuery,
	): Promise<SearchReport> {
		let report = SearchReport.none();
		try {
			const results = await this.providers.search(entry, query);
			report = SearchReport.answered(results);
		} catch (failure) {
			if (!(failure instanceof SearchFailedError)) throw failure;
			report = SearchReport.didNotAnswer(entry.displayName());
		}
		return report;
	}

	private merge(answers: SearchReport[]): SearchReport {
		let report = SearchReport.none();
		for (const answer of answers) report = report.and(answer);
		return report;
	}
}
