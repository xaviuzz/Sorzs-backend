import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";

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
