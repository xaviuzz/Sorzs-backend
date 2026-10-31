import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";

test("a registered source keeps its address", () => {
	const address = SourceAddress.from("https://example.com");

	const source = Source.register(address, PageInfo.none());

	expect(source.toJSON().address).toBe("https://example.com");
});

test("each registered source gets its own identifier", () => {
	const address = SourceAddress.from("https://example.com");

	const first = Source.register(address, PageInfo.none());
	const second = Source.register(address, PageInfo.none());

	expect(first.toJSON().sourceId).not.toBe(second.toJSON().sourceId);
});

test("two sources at the same address are the same site", () => {
	const first = Source.register(
		SourceAddress.from("https://example.com"),
		PageInfo.none(),
	);
	const second = Source.register(
		SourceAddress.from(" https://example.com"),
		PageInfo.none(),
	);

	expect(first.hasSameAddressAs(second)).toBe(true);
});

test("two sources at different addresses are not the same site", () => {
	const first = Source.register(
		SourceAddress.from("https://example.com"),
		PageInfo.none(),
	);
	const second = Source.register(
		SourceAddress.from("https://example.org"),
		PageInfo.none(),
	);

	expect(first.hasSameAddressAs(second)).toBe(false);
});

test("a registered source keeps the title and favicon the page offered", () => {
	const address = SourceAddress.from("https://example.com");
	const info = new PageInfo(
		PageTitle.from("Example"),
		FaviconAddress.from("https://example.com/icon.png"),
	);

	const source = Source.register(address, info);

	expect(source.toJSON()).toMatchObject({
		title: "Example",
		favicon: "https://example.com/icon.png",
	});
});

test("a source whose page offered nothing has no title and no favicon", () => {
	const address = SourceAddress.from("https://example.com");

	const source = Source.register(address, PageInfo.none());

	expect(source.toJSON()).toMatchObject({ title: null, favicon: null });
});
