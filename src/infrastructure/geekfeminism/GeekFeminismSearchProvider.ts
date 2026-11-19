import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import {
	GeekFeminismPage,
	type GeekFeminismPageJson,
} from "./GeekFeminismPage.ts";

const PAGES_PER_SORZ = 10;
const TIMEOUT_MS = 3000;

export class GeekFeminismSearchProvider implements SearchProvider {
	constructor(
		private readonly qualification: QualificationStrategy,
		private readonly fetchPage: WebFetch,
		private readonly contact: string,
	) {}

	id(): ProviderId {
		return ProviderId.geekfeminism();
	}

	canSearch(entry: SorzEntry): boolean {
		return this.qualification.qualifies(entry);
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults> {
		const pages = await this.askFor(entry.hostname(), query);
		const sorz = entry.displayName();
		let results = SearchResults.none();
		for (const page of pages) {
			results = results.with(new GeekFeminismPage(page).toResult(sorz));
		}
		return results;
	}

	private async askFor(
		hostname: string,
		query: SearchQuery,
	): Promise<GeekFeminismPageJson[]> {
		let pages: GeekFeminismPageJson[] = [];
		try {
			pages = await this.readPages(hostname, query);
		} catch (_failure) {
			throw new SearchFailedError();
		}
		return pages;
	}

	private async readPages(
		hostname: string,
		query: SearchQuery,
	): Promise<GeekFeminismPageJson[]> {
		const response = await this.fetchPage(
			this.searchUrl(hostname, query),
			this.requestInit(),
		);
		if (!response.ok) throw new SearchFailedError();
		const body = (await response.json()) as {
			query: { search: GeekFeminismPageJson[] };
		};
		if (!Array.isArray(body.query.search)) throw new SearchFailedError();
		return body.query.search;
	}

	private searchUrl(hostname: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const parameters = `action=query&list=search&srsearch=${term}&srlimit=${PAGES_PER_SORZ}&format=json`;
		return `https://${hostname}/api.php?${parameters}`;
	}

	private requestInit(): RequestInit {
		const headers = { "User-Agent": `Sorzs (${this.contact})` };
		const signal = AbortSignal.timeout(TIMEOUT_MS);
		return { headers, signal };
	}
}
