import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { ApiReply } from "../http/ApiReply.ts";
import type { ApiRequest } from "../http/ApiRequest.ts";
import { SearchAttempt } from "../http/SearchAttempt.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import type { GeekFeminismPageJson } from "./GeekFeminismPage.ts";
import type { GeekFeminismRequest } from "./GeekFeminismRequest.ts";

function pagesOf(body: { query: { search: GeekFeminismPageJson[] } }): unknown {
	return body.query.search;
}

export class GeekFeminismPages {
	private readonly attempt = new SearchAttempt();

	constructor(
		private readonly request: GeekFeminismRequest,
		private readonly api: ApiRequest,
		private readonly fetchPage: WebFetch,
	) {}

	async askFor(
		hostname: string,
		query: SearchQuery,
	): Promise<GeekFeminismPageJson[]> {
		const read = () => this.readPages(hostname, query);
		return this.attempt.run(read);
	}

	private async readPages(
		hostname: string,
		query: SearchQuery,
	): Promise<GeekFeminismPageJson[]> {
		const url = this.request.url(hostname, query);
		const response = await this.fetchPage(url, this.api.init());
		return new ApiReply(response).items<GeekFeminismPageJson>(pagesOf);
	}
}
