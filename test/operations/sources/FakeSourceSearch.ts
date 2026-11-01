import type { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import type { SourceSearch } from "../../../src/domain/search/SourceSearch.ts";
import type { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";

export class FakeSourceSearch implements SourceSearch {
	private readonly queries: string[] = [];
	private readonly slowAddresses = new Set<string>();
	private expectedTogether = 1;
	private release: () => void = () => {};
	private readonly allStarted = new Promise<void>((resolve) => {
		this.release = resolve;
	});

	isSlowFor(address: string): void {
		this.slowAddresses.add(address);
	}

	answersOnlyWhenTogether(count: number): void {
		this.expectedTogether = count;
	}

	async search(entry: SourceEntry, query: SearchQuery): Promise<SearchResult> {
		this.queries.push(query.toString());
		if (this.queries.length >= this.expectedTogether) this.release();
		await this.allStarted;
		const { address } = entry.toJSON();
		if (this.slowAddresses.has(address)) await Bun.sleep(20);
		const result = new SearchResult(
			"title",
			`link:${address}`,
			query.toString(),
			entry.displayName(),
		);
		return result;
	}

	searched(): string[] {
		return [...this.queries];
	}
}
