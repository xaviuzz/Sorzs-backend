import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { ApiReply } from "../http/ApiReply.ts";
import type { ApiRequest } from "../http/ApiRequest.ts";
import { SearchAttempt } from "../http/SearchAttempt.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import type { MediaWikiPageJson } from "./MediaWikiPage.ts";
import type { MediaWikiRequest } from "./MediaWikiRequest.ts";

function pagesOf(body: { query: { search: MediaWikiPageJson[] } }): unknown {
	return body.query.search;
}

export class MediaWikiPages {
	private readonly attempt = new SearchAttempt();

	constructor(
		private readonly request: MediaWikiRequest,
		private readonly api: ApiRequest,
		private readonly fetchPage: WebFetch,
	) {}

	async askFor(
		hostname: string,
		query: SearchQuery,
	): Promise<MediaWikiPageJson[]> {
		const read = () => this.readPages(hostname, query);
		return this.attempt.run(read);
	}

	private async readPages(
		hostname: string,
		query: SearchQuery,
	): Promise<MediaWikiPageJson[]> {
		const url = this.request.url(hostname, query);
		const response = await this.fetchPage(url, this.api.init());
		return new ApiReply(response).items<MediaWikiPageJson>(pagesOf);
	}
}
