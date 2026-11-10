import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";

test("a registered sorz keeps its address", () => {
	const address = SorzAddress.from("https://example.com");

	const sorz = Sorz.register(address, PageInfo.none());

	expect(sorz.toJSON().address).toBe("https://example.com");
});

test("each registered sorz gets its own identifier", () => {
	const address = SorzAddress.from("https://example.com");

	const first = Sorz.register(address, PageInfo.none());
	const second = Sorz.register(address, PageInfo.none());

	expect(first.toJSON().sorzId).not.toBe(second.toJSON().sorzId);
});

test("two sorzs at the same address are the same site", () => {
	const first = Sorz.register(
		SorzAddress.from("https://example.com"),
		PageInfo.none(),
	);
	const second = Sorz.register(
		SorzAddress.from(" https://example.com"),
		PageInfo.none(),
	);

	expect(first.hasSameAddressAs(second)).toBe(true);
});

test("two sorzs at different addresses are not the same site", () => {
	const first = Sorz.register(
		SorzAddress.from("https://example.com"),
		PageInfo.none(),
	);
	const second = Sorz.register(
		SorzAddress.from("https://example.org"),
		PageInfo.none(),
	);

	expect(first.hasSameAddressAs(second)).toBe(false);
});

test("a registered sorz keeps the title and favicon the page offered", () => {
	const address = SorzAddress.from("https://example.com");
	const info = new PageInfo(
		PageTitle.from("Example"),
		FaviconAddress.from("https://example.com/icon.png"),
	);

	const sorz = Sorz.register(address, info);

	expect(sorz.toJSON()).toMatchObject({
		title: "Example",
		favicon: "https://example.com/icon.png",
	});
});

test("a sorz whose page offered nothing has no title and no favicon", () => {
	const address = SorzAddress.from("https://example.com");

	const sorz = Sorz.register(address, PageInfo.none());

	expect(sorz.toJSON()).toMatchObject({ title: null, favicon: null });
});
