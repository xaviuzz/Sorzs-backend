import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { ApiReply } from "../http/ApiReply.ts";
import { ApiRequest } from "../http/ApiRequest.ts";
import { SearchAttempt } from "../http/SearchAttempt.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import {
	GeekFeminismPage,
	type GeekFeminismPageJson,
} from "./GeekFeminismPage.ts";

function pagesOf(body: { query: { search: GeekFeminismPageJson[] } }): unknown {
	return body.query.search;
}

export class GeekFeminismSearchProvider implements SearchProvider {
	private readonly api: ApiRequest;
	private readonly attempt = new SearchAttempt();

	constructor(
		private readonly qualification: QualificationStrategy,
		private readonly fetchPage: WebFetch,
		contact: string,
	) {
		this.api = new ApiRequest(contact);
	}

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
		const read = () => this.readPages(hostname, query);
		return this.attempt.run(read);
	}

	private async readPages(
		hostname: string,
		query: SearchQuery,
	): Promise<GeekFeminismPageJson[]> {
		const url = this.searchUrl(hostname, query);
		const response = await this.fetchPage(url, this.api.init());
		return new ApiReply(response).items<GeekFeminismPageJson>(pagesOf);
	}

	private searchUrl(hostname: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const limit = this.api.pagesLimit();
		const parameters = `action=query&list=search&srsearch=${term}&srlimit=${limit}&format=json`;
		return `https://${hostname}/api.php?${parameters}`;
	}
}
