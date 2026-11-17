import { expect, test } from "bun:test";
import { WikipediaSite } from "../../../src/domain/search/WikipediaSite.ts";

test("reads the language of a language site", () => {
	const site = new WikipediaSite("es.wikipedia.org");
	expect(site.isWikipedia()).toBe(true);
	expect(site.language()).toBe("es");
});

test("reads the language of the mobile form", () => {
	const site = new WikipediaSite("en.m.wikipedia.org");
	expect(site.isWikipedia()).toBe(true);
	expect(site.language()).toBe("en");
});

test("reads a language code with hyphens", () => {
	const site = new WikipediaSite("zh-yue.wikipedia.org");
	expect(site.language()).toBe("zh-yue");
});

test("is not a Wikipedia without a language or with www", () => {
	expect(new WikipediaSite("wikipedia.org").isWikipedia()).toBe(false);
	expect(new WikipediaSite("www.wikipedia.org").isWikipedia()).toBe(false);
});

test("is not a Wikipedia when it only looks like one", () => {
	expect(new WikipediaSite("notwikipedia.org").isWikipedia()).toBe(false);
	expect(new WikipediaSite("es.wikipedia.org.evil.org").isWikipedia()).toBe(
		false,
	);
	expect(new WikipediaSite("a.es.wikipedia.org").isWikipedia()).toBe(false);
});

test("has no language when it is not a Wikipedia", () => {
	expect(new WikipediaSite("example.com").language()).toBe("");
});
