import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import { WikipediaSite } from "../../domain/search/WikipediaSite.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { ApiRequest } from "../http/ApiRequest.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import type { Clock } from "./Clock.ts";
import { WikipediaPage } from "./WikipediaPage.ts";
import { WikipediaPages } from "./WikipediaPages.ts";
import { WikipediaRequest } from "./WikipediaRequest.ts";

export class WikipediaSearchProvider implements SearchProvider {
	private readonly wikipediaPages: WikipediaPages;

	constructor(
		private readonly qualification: QualificationStrategy,
		fetchPage: WebFetch,
		contact: string,
		clock: Clock,
	) {
		const api = new ApiRequest(contact);
		const request = new WikipediaRequest(api);
		this.wikipediaPages = new WikipediaPages(request, api, fetchPage, clock);
	}

	id(): ProviderId {
		return ProviderId.wikipedia();
	}

	name(): string {
		return "Wikipedia";
	}

	canSearch(entry: SorzEntry): boolean {
		return this.qualification.qualifies(entry);
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults> {
		const language = new WikipediaSite(entry.hostname()).language();
		const pages = await this.wikipediaPages.askFor(language, query);
		const sorz = entry.displayName();
		let results = SearchResults.none();
		for (const page of pages) {
			results = results.with(new WikipediaPage(page).toResult(language, sorz));
		}
		return results;
	}
}
