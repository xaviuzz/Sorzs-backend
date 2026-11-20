import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import type { Clock } from "./Clock.ts";
import { RetryAfter } from "./RetryAfter.ts";
import { SlowDowns } from "./SlowDowns.ts";
import type { WikipediaPageJson } from "./WikipediaPage.ts";
import type { WikipediaRequest } from "./WikipediaRequest.ts";

const TOO_MANY_REQUESTS = 429;

export class WikipediaPages {
	private readonly slowDowns: SlowDowns;

	constructor(
		private readonly request: WikipediaRequest,
		private readonly fetchPage: WebFetch,
		clock: Clock,
	) {
		this.slowDowns = new SlowDowns(clock);
	}

	async askFor(
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
		const url = this.request.url(language, query);
		const init = this.request.init();
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
}
