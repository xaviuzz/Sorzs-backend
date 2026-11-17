import { expect, test } from "bun:test";
import { DomainQualificationStrategy } from "../../../src/domain/search/DomainQualificationStrategy.ts";
import { entryAt } from "../sorz-list/EntryAt.ts";

test("qualifies a sorz on the domain itself", () => {
	expect(qualifies("https://reddit.com")).toBe(true);
});

test("qualifies a sorz on a subdomain of the domain, whatever its path", () => {
	expect(qualifies("https://www.reddit.com/r/spain")).toBe(true);
	expect(qualifies("https://old.reddit.com")).toBe(true);
});

test("qualifies a sorz whose address has a port", () => {
	expect(qualifies("http://reddit.com:8080/r/spain")).toBe(true);
});

test("does not qualify a domain that only ends with the same letters", () => {
	expect(qualifies("https://notreddit.com")).toBe(false);
});

test("does not qualify a domain that only starts with the same letters", () => {
	expect(qualifies("https://reddit.com.evil.org")).toBe(false);
});

test("does not qualify a sorz that only has the domain in its path", () => {
	expect(qualifies("https://example.com/reddit.com")).toBe(false);
});

function qualifies(address: string): boolean {
	const strategy = new DomainQualificationStrategy("reddit.com");
	return strategy.qualifies(entryAt(address));
}
