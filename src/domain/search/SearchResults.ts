import type { SearchResult } from "./SearchResult.ts";

export class SearchResults {
	private constructor(private readonly results: SearchResult[]) {}

	static none(): SearchResults {
		return new SearchResults([]);
	}

	with(result: SearchResult): SearchResults {
		return new SearchResults([...this.results, result]);
	}

	toJSON(): ReturnType<SearchResult["toJSON"]>[] {
		const json: ReturnType<SearchResult["toJSON"]>[] = [];
		for (const result of this.results) json.push(result.toJSON());
		return json;
	}
}
