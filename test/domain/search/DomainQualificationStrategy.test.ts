import { expect, test } from "bun:test";
import { DomainQualificationStrategy } from "../../../src/domain/search/DomainQualificationStrategy.ts";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";

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
	const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
	const sorz = Sorz.register(SorzAddress.from(address), info);
	const entry = new SorzEntry(sorz, SorzName.fromOptional(""));
	return strategy.qualifies(entry);
}
