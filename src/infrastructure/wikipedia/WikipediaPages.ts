import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { ApiReply } from "../http/ApiReply.ts";
import type { ApiRequest } from "../http/ApiRequest.ts";
import { SearchAttempt } from "../http/SearchAttempt.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import type { Clock } from "./Clock.ts";
import { RetryAfter } from "./RetryAfter.ts";
import { SlowDowns } from "./SlowDowns.ts";
import type { WikipediaPageJson } from "./WikipediaPage.ts";
import type { WikipediaRequest } from "./WikipediaRequest.ts";

const TOO_MANY_REQUESTS = 429;

function pagesOf(body: { pages: WikipediaPageJson[] }): unknown {
	return body.pages;
}

export class WikipediaPages {
	private readonly slowDowns: SlowDowns;
	private readonly attempt = new SearchAttempt();

	constructor(
		private readonly request: WikipediaRequest,
		private readonly api: ApiRequest,
		private readonly fetchPage: WebFetch,
		clock: Clock,
	) {
		this.slowDowns = new SlowDowns(clock);
	}

	async askFor(
		language: string,
		query: SearchQuery,
	): Promise<WikipediaPageJson[]> {
		const read = () => this.readPages(language, query);
		return this.attempt.run(read);
	}

	private async readPages(
		language: string,
		query: SearchQuery,
	): Promise<WikipediaPageJson[]> {
		this.requireNotSlowedDown(language);
		const url = this.request.url(language, query);
		const init = this.api.init();
		const response = await this.fetchPage(url, init);
		this.noteSlowDown(language, response);
		return new ApiReply(response).items<WikipediaPageJson>(pagesOf);
	}

	private requireNotSlowedDown(language: string): void {
		if (this.slowDowns.isSlowFor(language)) throw new SearchFailedError();
	}

	private noteSlowDown(language: string, response: Response): void {
		const isAskedToSlowDown = response.status === TOO_MANY_REQUESTS;
		const retryAfter = RetryAfter.from(response.headers.get("Retry-After"));
		if (isAskedToSlowDown) this.slowDowns.startFor(language, retryAfter);
	}
}
