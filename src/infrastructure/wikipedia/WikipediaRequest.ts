import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import type { ApiRequest } from "../http/ApiRequest.ts";

export class WikipediaRequest {
	constructor(private readonly api: ApiRequest) {}

	url(language: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const site = `https://${language}.wikipedia.org`;
		const limit = this.api.pagesLimit();
		const url = `${site}/w/rest.php/v1/search/page?q=${term}&limit=${limit}`;
		return url;
	}

	init(): RequestInit {
		return this.api.init();
	}
}
