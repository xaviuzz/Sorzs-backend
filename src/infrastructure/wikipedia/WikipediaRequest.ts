import type { SearchQuery } from "../../domain/search/SearchQuery.ts";

const PAGES_PER_SORZ = 10;
const TIMEOUT_MS = 3000;

export class WikipediaRequest {
	constructor(private readonly contact: string) {}

	url(language: string, query: SearchQuery): string {
		const term = encodeURIComponent(query.toString());
		const site = `https://${language}.wikipedia.org`;
		const url = `${site}/w/rest.php/v1/search/page?q=${term}&limit=${PAGES_PER_SORZ}`;
		return url;
	}

	init(): RequestInit {
		const headers = { "User-Agent": `Sorzs (${this.contact})` };
		const signal = AbortSignal.timeout(TIMEOUT_MS);
		return { headers, signal };
	}
}
