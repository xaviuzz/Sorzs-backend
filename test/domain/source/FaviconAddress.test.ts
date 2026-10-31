import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";

test("keeps an https address", () => {
	const favicon = FaviconAddress.from("https://example.com/icon.png");

	expect(favicon.toJSON()).toBe("https://example.com/icon.png");
});

test("keeps an http address", () => {
	const favicon = FaviconAddress.from("http://example.com/favicon.ico");

	expect(favicon.toJSON()).toBe("http://example.com/favicon.ico");
});

test("drops a data address", () => {
	const favicon = FaviconAddress.from("data:image/png;base64,AAAA");

	expect(favicon.toJSON()).toBeNull();
});

test("drops a javascript address", () => {
	const favicon = FaviconAddress.from("javascript:alert(1)");

	expect(favicon.toJSON()).toBeNull();
});

test("drops text that is not an address", () => {
	const favicon = FaviconAddress.from("not an address");

	expect(favicon.toJSON()).toBeNull();
});

test("no favicon is missing", () => {
	const favicon = FaviconAddress.none();

	expect(favicon.toJSON()).toBeNull();
});
