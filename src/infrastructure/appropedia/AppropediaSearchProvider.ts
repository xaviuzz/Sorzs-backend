import { ProviderId } from "../../domain/search/ProviderId.ts";
import type { QualificationStrategy } from "../../domain/search/QualificationStrategy.ts";
import type { SearchProvider } from "../../domain/search/SearchProvider.ts";
import type { SearchQuery } from "../../domain/search/SearchQuery.ts";
import { SearchResults } from "../../domain/search/SearchResults.ts";
import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { ApiRequest } from "../http/ApiRequest.ts";
import type { WebFetch } from "../http/WebFetch.ts";
import { MediaWikiPage } from "../mediawiki/MediaWikiPage.ts";
import { MediaWikiPages } from "../mediawiki/MediaWikiPages.ts";
import { MediaWikiRequest } from "../mediawiki/MediaWikiRequest.ts";

const HOST = "www.appropedia.org";
const API_PATH = "/w/api.php";
const ARTICLE_BASE = "https://www.appropedia.org/";

export class AppropediaSearchProvider implements SearchProvider {
	private readonly mediaWikiPages: MediaWikiPages;

	constructor(
		private readonly qualification: QualificationStrategy,
		fetchPage: WebFetch,
		contact: string,
	) {
		const api = new ApiRequest(contact);
		const request = new MediaWikiRequest(api, API_PATH);
		this.mediaWikiPages = new MediaWikiPages(request, api, fetchPage);
	}

	id(): ProviderId {
		return ProviderId.appropedia();
	}

	name(): string {
		return "Appropedia";
	}

	canSearch(entry: SorzEntry): boolean {
		return this.qualification.qualifies(entry);
	}

	async search(entry: SorzEntry, query: SearchQuery): Promise<SearchResults> {
		const pages = await this.mediaWikiPages.askFor(HOST, query);
		const sorz = entry.displayName();
		let results = SearchResults.none();
		for (const page of pages) {
			results = results.with(
				new MediaWikiPage(page, ARTICLE_BASE).toResult(sorz),
			);
		}
		return results;
	}
}
