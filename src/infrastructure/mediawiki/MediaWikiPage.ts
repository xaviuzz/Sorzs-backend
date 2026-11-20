import { SearchResult } from "../../domain/search/SearchResult.ts";
import { SearchExcerpt } from "../http/SearchExcerpt.ts";

export type MediaWikiPageJson = {
	title: string;
	snippet: string;
};

export class MediaWikiPage {
	constructor(
		private readonly json: MediaWikiPageJson,
		private readonly articleBase: string,
	) {}

	toResult(sorz: string): SearchResult {
		const title = this.json.title;
		const description = new SearchExcerpt(this.json.snippet).plainText();
		return new SearchResult(title, this.link(), description, sorz);
	}

	private link(): string {
		const underscored = this.json.title.replaceAll(" ", "_");
		const encoded = encodeURIComponent(underscored)
			.replaceAll("%2F", "/")
			.replaceAll("%3A", ":");
		return `${this.articleBase}${encoded}`;
	}
}
