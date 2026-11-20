import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import type { ApiRequest } from "../http/ApiRequest.ts";

export class MediaWikiRequest {
	constructor(
		private readonly api: ApiRequest,
		private readonly apiPath: string,
	) {}

	url(hostname: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const limit = this.api.pagesLimit();
		const parameters = `action=query&list=search&srsearch=${term}&srlimit=${limit}&format=json`;
		return `https://${hostname}${this.apiPath}?${parameters}`;
	}
}
