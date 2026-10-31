import { expect, test } from "bun:test";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";

test("a registered source keeps its address", () => {
	const address = SourceAddress.from("https://example.com");

	const source = Source.register(address);

	expect(source.toJSON().address).toBe("https://example.com");
});

test("each registered source gets its own identifier", () => {
	const address = SourceAddress.from("https://example.com");

	const first = Source.register(address);
	const second = Source.register(address);

	expect(first.toJSON().sourceId).not.toBe(second.toJSON().sourceId);
});

test("two sources at the same address are the same site", () => {
	const first = Source.register(SourceAddress.from("https://example.com"));
	const second = Source.register(SourceAddress.from(" https://example.com"));

	expect(first.hasSameAddressAs(second)).toBe(true);
});

test("two sources at different addresses are not the same site", () => {
	const first = Source.register(SourceAddress.from("https://example.com"));
	const second = Source.register(SourceAddress.from("https://example.org"));

	expect(first.hasSameAddressAs(second)).toBe(false);
});
