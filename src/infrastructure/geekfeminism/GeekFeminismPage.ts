import { SearchResult } from "../../domain/search/SearchResult.ts";

export type GeekFeminismPageJson = {
	title: string;
};

const WIKI = "https://geekfeminism.fandom.com/wiki/";

export class GeekFeminismPage {
	constructor(private readonly json: GeekFeminismPageJson) {}

	toResult(sorz: string): SearchResult {
		return new SearchResult(this.json.title, this.link(), "", sorz);
	}

	private link(): string {
		const underscored = this.json.title.replaceAll(" ", "_");
		const encoded = encodeURIComponent(underscored)
			.replaceAll("%2F", "/")
			.replaceAll("%3A", ":");
		return `${WIKI}${encoded}`;
	}
}
