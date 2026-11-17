import { expect, test } from "bun:test";
import { WikipediaQualificationStrategy } from "../../../src/domain/search/WikipediaQualificationStrategy.ts";
import { entryAt } from "../sorz-list/EntryAt.ts";

test("qualifies a sorz on a language site, whatever its path", () => {
	expect(qualifies("https://es.wikipedia.org")).toBe(true);
	expect(qualifies("https://es.wikipedia.org/wiki/Ciberpunk")).toBe(true);
});

test("qualifies a sorz on the mobile form of a language site", () => {
	expect(qualifies("https://en.m.wikipedia.org")).toBe(true);
});

test("qualifies a sorz whose address has a port", () => {
	expect(qualifies("http://es.wikipedia.org:8080/wiki/Ciberpunk")).toBe(true);
});

test("qualifies a language code with hyphens or a longer word", () => {
	expect(qualifies("https://zh-yue.wikipedia.org")).toBe(true);
	expect(qualifies("https://simple.wikipedia.org")).toBe(true);
});

test("does not qualify an address with no language", () => {
	expect(qualifies("https://wikipedia.org")).toBe(false);
	expect(qualifies("https://www.wikipedia.org")).toBe(false);
});

test("does not qualify a domain that only ends with the same letters", () => {
	expect(qualifies("https://notwikipedia.org")).toBe(false);
	expect(qualifies("https://es.notwikipedia.org")).toBe(false);
});

test("does not qualify a domain that only starts with the same letters", () => {
	expect(qualifies("https://es.wikipedia.org.evil.org")).toBe(false);
});

test("does not qualify a sorz that only has wikipedia.org in its path", () => {
	expect(qualifies("https://example.com/es.wikipedia.org")).toBe(false);
});

test("does not qualify other labels before the language", () => {
	expect(qualifies("https://a.es.wikipedia.org")).toBe(false);
});

function qualifies(address: string): boolean {
	const strategy = new WikipediaQualificationStrategy();
	return strategy.qualifies(entryAt(address));
}
