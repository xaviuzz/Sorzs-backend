import type { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import type { SorzSearch } from "../../../src/domain/search/SorzSearch.ts";
import type { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";

export class FakeSorzSearch implements SorzSearch {
	private readonly queries: string[] = [];
	private readonly slowSites = new Set<string>();
	private expectedTogether = 1;
	private release: () => void = () => {};
	private readonly allStarted = new Promise<void>((resolve) => {
		this.release = resolve;
	});

	isSlowFor(site: string): void {
		this.slowSites.add(site);
	}

	answersOnlyWhenTogether(count: number): void {
		this.expectedTogether = count;
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResult> {
		this.queries.push(query.toString());
		if (this.queries.length >= this.expectedTogether) this.release();
		await this.allStarted;
		const site = entry.site();
		if (this.slowSites.has(site)) await Bun.sleep(20);
		const result = new SearchResult(
			"title",
			`link:${site}`,
			query.toString(),
			entry.displayName(),
		);
		return result;
	}

	searched(): string[] {
		return [...this.queries];
	}
}
