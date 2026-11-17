import { decode } from "he";
import { SearchResult } from "../../domain/search/SearchResult.ts";

export type WikipediaPageJson = {
	title: string;
	key: string;
	description: string | null;
	excerpt: string;
};

const TAG = /<[^>]*>/g;

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
		const withoutTags = this.json.excerpt.replace(TAG, "");
		const plain = decode(withoutTags);
		return plain;
	}
}
