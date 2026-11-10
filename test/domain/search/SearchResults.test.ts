import { expect, test } from "bun:test";
import { SearchResult } from "../../../src/domain/search/SearchResult.ts";
import { SearchResults } from "../../../src/domain/search/SearchResults.ts";

test("a result holds its title, link, description and sorz", () => {
	const result = new SearchResult("Title", "https://a.example", "About", "A");

	expect(result.toJSON()).toEqual({
		title: "Title",
		url: "https://a.example",
		description: "About",
		sorz: "A",
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

	expect(sorzsOf(results)).toEqual(["Second", "First"]);
});

test("adding an answer leaves the earlier results unchanged", () => {
	const before = SearchResults.none();

	before.with(resultFrom("A"));

	expect(before.toJSON()).toEqual([]);
});

function resultFrom(sorz: string): SearchResult {
	return new SearchResult("Title", "https://a.example", "About", sorz);
}

function sorzsOf(results: SearchResults): string[] {
	const sorzs: string[] = [];
	for (const result of results.toJSON()) sorzs.push(result.sorz);
	return sorzs;
}
