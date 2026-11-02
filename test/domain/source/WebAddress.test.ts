import { expect, test } from "bun:test";
import { WebAddress } from "../../../src/domain/source/WebAddress.ts";

function textsOf(addresses: WebAddress[]): string[] {
	const texts = addresses.map((address) => address.toString());
	return texts;
}

test("an http address is valid", () => {
	expect(new WebAddress("http://example.com").isValid()).toBe(true);
});

test("an https address is valid", () => {
	expect(new WebAddress("https://example.com/docs").isValid()).toBe(true);
});

test("an address that is not http or https is not valid", () => {
	expect(new WebAddress("ftp://example.com").isValid()).toBe(false);
	expect(new WebAddress("data:image/png;base64,AAAA").isValid()).toBe(false);
	expect(new WebAddress("javascript:alert(1)").isValid()).toBe(false);
});

test("text that is not a complete address is not valid", () => {
	expect(new WebAddress("example.com").isValid()).toBe(false);
	expect(new WebAddress("/docs").isValid()).toBe(false);
	expect(new WebAddress("").isValid()).toBe(false);
});

test("its prefixes are the origin and each prefix of its path", () => {
	const address = new WebAddress("https://talk.com/a/b?x=1#y");

	expect(textsOf(address.prefixes())).toEqual([
		"https://talk.com",
		"https://talk.com/a",
		"https://talk.com/a/b",
	]);
});

test("an origin has only itself as prefix", () => {
	const address = new WebAddress("https://talk.com/");

	expect(textsOf(address.prefixes())).toEqual(["https://talk.com"]);
});

test("its site is the host and the path without the final slash", () => {
	expect(new WebAddress("https://talk.com/docs/").site()).toBe("talk.com/docs");
	expect(new WebAddress("https://talk.com/").site()).toBe("talk.com");
});

test("two addresses that differ only by the final slash are equal ignoring it", () => {
	const withSlash = new WebAddress("https://talk.com/dfe/");
	const withoutSlash = new WebAddress("https://talk.com/dfe");

	expect(withSlash.equalsIgnoringFinalSlash(withoutSlash)).toBe(true);
	expect(withoutSlash.equalsIgnoringFinalSlash(withSlash)).toBe(true);
});

test("two different addresses are not equal ignoring the final slash", () => {
	const first = new WebAddress("https://talk.com/dfe");
	const second = new WebAddress("https://talk.com/dfe/other");

	expect(first.equalsIgnoringFinalSlash(second)).toBe(false);
});

test("resolves a relative reference against itself", () => {
	const page = new WebAddress("https://talk.com/docs/index.html");

	expect(page.resolve("/favicon.ico").toString()).toBe(
		"https://talk.com/favicon.ico",
	);
	expect(page.resolve("icon.png").toString()).toBe(
		"https://talk.com/docs/icon.png",
	);
});

test("resolves an absolute reference to itself", () => {
	const page = new WebAddress("https://talk.com/docs");

	expect(page.resolve("https://cdn.com/icon.png").toString()).toBe(
		"https://cdn.com/icon.png",
	);
});

test("a reference that cannot be resolved gives an address that is not valid", () => {
	const page = new WebAddress("https://talk.com");

	expect(page.resolve("http://").isValid()).toBe(false);
});
