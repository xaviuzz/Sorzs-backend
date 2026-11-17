import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import { WikipediaSite } from "../../domain/search/WikipediaSite.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import type { Clock } from "./Clock.ts";
import { RetryAfter } from "./RetryAfter.ts";
import { SlowDowns } from "./SlowDowns.ts";
import { WikipediaPage, type WikipediaPageJson } from "./WikipediaPage.ts";

export type WikipediaFetch = (
	url: string,
	init: RequestInit,
) => Promise<Response>;

const PAGES_PER_SORZ = 10;
const TIMEOUT_MS = 3000;
const TOO_MANY_REQUESTS = 429;

export class WikipediaSearchProvider implements SearchProvider {
	private readonly slowDowns: SlowDowns;

	constructor(
		private readonly qualification: QualificationStrategy,
		private readonly fetchPage: WikipediaFetch,
		private readonly contact: string,
		clock: Clock,
	) {
		this.slowDowns = new SlowDowns(clock);
	}

	id(): ProviderId {
		return ProviderId.wikipedia();
	}

	canSearch(entry: SorzEntry): boolean {
		return this.qualification.qualifies(entry);
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults> {
		const language = new WikipediaSite(entry.hostname()).language();
		const pages = await this.askFor(language, query);
		const sorz = entry.displayName();
		let results = SearchResults.none();
		for (const page of pages) {
			results = results.with(new WikipediaPage(page).toResult(language, sorz));
		}
		return results;
	}

	private async askFor(
		language: string,
		query: SearchQuery,
	): Promise<WikipediaPageJson[]> {
		let pages: WikipediaPageJson[] = [];
		try {
			pages = await this.readPages(language, query);
		} catch (_failure) {
			throw new SearchFailedError();
		}
		return pages;
	}

	private async readPages(
		language: string,
		query: SearchQuery,
	): Promise<WikipediaPageJson[]> {
		this.requireNotSlowedDown(language);
		const url = this.searchUrl(language, query);
		const init = this.requestInit();
		const response = await this.fetchPage(url, init);
		this.noteSlowDown(language, response);
		this.requireSuccess(response);
		const body = (await response.json()) as { pages: WikipediaPageJson[] };
		this.requirePages(body.pages);
		return body.pages;
	}

	private requireNotSlowedDown(language: string): void {
		if (this.slowDowns.isSlowFor(language)) throw new SearchFailedError();
	}

	private noteSlowDown(language: string, response: Response): void {
		const isAskedToSlowDown = response.status === TOO_MANY_REQUESTS;
		const retryAfter = RetryAfter.from(response.headers.get("Retry-After"));
		if (isAskedToSlowDown) this.slowDowns.startFor(language, retryAfter);
	}

	private requireSuccess(response: Response): void {
		if (!response.ok) throw new SearchFailedError();
	}

	private requirePages(pages: unknown): void {
		if (!Array.isArray(pages)) throw new SearchFailedError();
	}

	private searchUrl(language: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const site = `https://${language}.wikipedia.org`;
		const url = `${site}/w/rest.php/v1/search/page?q=${term}&limit=${PAGES_PER_SORZ}`;
		return url;
	}

	private requestInit(): RequestInit {
		const headers = { "User-Agent": `Sorzs (${this.contact})` };
		const signal = AbortSignal.timeout(TIMEOUT_MS);
		return { headers, signal };
	}
}
