import { ProviderId } from "../../../src/domain/search/ProviderId.ts";
import { SearchFailedError } from "../../../src/domain/search/SearchFailedError.ts";
import type { SearchProvider } from "../../../src/domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import { SearchResults } from "../../../src/domain/search/SearchResults.ts";
import type { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";

export class FakeSearchProvider implements SearchProvider {
	private readonly queries: string[] = [];
	private readonly slowSites = new Set<string>();
	private readonly failingSites = new Set<string>();
	private expectedTogether = 1;
	private release: () => void = () => {};
	private readonly allStarted = new Promise<void>((resolve) => {
		this.release = resolve;
	});

	isSlowFor(site: string): void {
		this.slowSites.add(site);
	}

	failsFor(site: string): void {
		this.failingSites.add(site);
	}

	answersOnlyWhenTogether(count: number): void {
		this.expectedTogether = count;
	}

	id(): ProviderId {
		return ProviderId.generic();
	}

	name(): string {
		return "Generic";
	}

	canSearch(): boolean {
		return true;
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults> {
		this.queries.push(query.toString());
		if (this.queries.length >= this.expectedTogether) this.release();
		await this.allStarted;
		const site = entry.site();
		if (this.failingSites.has(site)) throw new SearchFailedError();
		if (this.slowSites.has(site)) await Bun.sleep(20);
		const result = new SearchResult(
			"title",
			`link:${site}`,
			query.toString(),
			entry.displayName(),
		);
		return SearchResults.none().with(result);
	}

	searched(): string[] {
		return [...this.queries];
	}
}
