import { SearchResult } from "../../domain/search/SearchResult.ts";
import { SearchExcerpt } from "../http/SearchExcerpt.ts";

export type WikipediaPageJson = {
	title: string;
	key: string;
	description: string | null;
	excerpt: string;
};

export class WikipediaPage {
	constructor(private readonly json: WikipediaPageJson) {}

	toResult(language: string, sorz: string): SearchResult {
		const title = this.json.title;
		const url = this.linkIn(language);
		const description = this.describe();
		return new SearchResult(title, url, description, sorz);
	}

	private linkIn(language: string): string {
		const encodedKey = encodeURIComponent(this.json.key);
		const link = `https://${language}.wikipedia.org/wiki/${encodedKey}`;
		return link;
	}

	private describe(): string {
		const description = this.json.description;
		const hasDescription =
			typeof description === "string" && description !== "";
		let described = "";
		if (hasDescription) described = description;
		if (!hasDescription) described = this.plainExcerpt();
		return described;
	}

	private plainExcerpt(): string {
		const excerpt = new SearchExcerpt(this.json.excerpt);
		const plain = excerpt.plainText();
		return plain;
	}
}
