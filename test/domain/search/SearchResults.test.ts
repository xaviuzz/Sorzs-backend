import { expect, test } from "bun:test";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import { SearchResults } from "../../../src/domain/search/SearchResults.ts";

test("a result holds its title, link, description and source", () => {
	const result = new SearchResult("Title", "https://a.example", "About", "A");

	expect(result.toJSON()).toEqual({
		title: "Title",
		url: "https://a.example",
		description: "About",
		source: "A",
	});
});

test("no answers give no results", () => {
	const results = SearchResults.none();

	expect(results.toJSON()).toEqual([]);
});

test("results come in the order the answers were added", () => {
	let results = SearchResults.none();
	results = results.with(resultFrom("Second"));
	results = results.with(resultFrom("First"));

	expect(sourcesOf(results)).toEqual(["Second", "First"]);
});

test("adding an answer leaves the earlier results unchanged", () => {
	const before = SearchResults.none();

	before.with(resultFrom("A"));

	expect(before.toJSON()).toEqual([]);
});

function resultFrom(source: string): SearchResult {
	return new SearchResult("Title", "https://a.example", "About", source);
}

function sourcesOf(results: SearchResults): string[] {
	const sources: string[] = [];
	for (const result of results.toJSON()) sources.push(result.source);
	return sources;
}
