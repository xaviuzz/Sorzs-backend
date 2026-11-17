import { SearchResults } from "./SearchResults.ts";

type ReportJson = {
	results: ReturnType<SearchResults["toJSON"]>;
	failed: string[];
};

export class SearchReport {
	private constructor(
		private readonly results: SearchResults,
		private readonly failed: string[],
	) {}

	static none(): SearchReport {
		return new SearchReport(SearchResults.none(), []);
	}

	static answered(results: SearchResults): SearchReport {
		return new SearchReport(results, []);
	}

	static didNotAnswer(sorz: string): SearchReport {
		return new SearchReport(SearchResults.none(), [sorz]);
	}

	and(other: SearchReport): SearchReport {
		const results = this.results.and(other.results);
		const failed = [...this.failed, ...other.failed];
		return new SearchReport(results, failed);
	}

	toJSON(): ReportJson {
		return { results: this.results.toJSON(), failed: [...this.failed] };
	}
}
