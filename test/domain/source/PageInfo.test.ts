import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";

test("holds the title and the favicon of a page", () => {
	const info = new PageInfo(
		PageTitle.from("Example"),
		FaviconAddress.from("https://example.com/icon.png"),
	);

	expect(info.toJSON()).toEqual({
		title: "Example",
		favicon: "https://example.com/icon.png",
	});
});

test("a page with nothing to offer has both parts missing", () => {
	const info = PageInfo.none();

	expect(info.toJSON()).toEqual({ title: null, favicon: null });
});

test("has a title only when the page offers one", () => {
	const withTitle = new PageInfo(
		PageTitle.from("Example"),
		FaviconAddress.none(),
	);

	expect(withTitle.hasTitle()).toBe(true);
	expect(PageInfo.none().hasTitle()).toBe(false);
});

test("describes itself as a candidate at an address", () => {
	const info = new PageInfo(
		PageTitle.from("Example"),
		FaviconAddress.from("https://example.com/icon.png"),
	);
	const address = SourceAddress.from("https://example.com");

	expect(info.toCandidateJSON(address)).toEqual({
		address: "https://example.com",
		title: "Example",
		favicon: "https://example.com/icon.png",
	});
});
