import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";

test("is shown by the name the user gave it", () => {
	const entry = entryWith("My docs", "Example");

	expect(entry.displayName()).toBe("My docs");
});

test("is shown by the title of its page when the user gave no name", () => {
	const entry = entryWith("", "Example");

	expect(entry.displayName()).toBe("Example");
});

test("is shown by its address when it has no name and no title", () => {
	const entry = entryWith("", "");

	expect(entry.displayName()).toBe("https://example.com/docs");
});

function entryWith(name: string, title: string): SorzEntry {
	const address = SorzAddress.from("https://example.com/docs");
	const info = new PageInfo(PageTitle.from(title), FaviconAddress.none());
	const sorz = Sorz.register(address, info);
	return new SorzEntry(sorz, SorzName.fromOptional(name));
}

test("is restored from its JSON as it was", () => {
	const entry = entryWith("My docs", "Example");
	const json = entry.toJSON();

	const restored = SorzEntry.fromJSON(json);

	expect(restored.toJSON()).toEqual(json);
});

test("is restored without name, title or favicon", () => {
	const entry = entryWith("", "");
	const json = entry.toJSON();

	const restored = SorzEntry.fromJSON(json);

	expect(restored.toJSON()).toEqual(json);
});

test("is restored with its favicon", () => {
	const address = SorzAddress.from("https://example.com/docs");
	const favicon = FaviconAddress.from("https://example.com/icon.png");
	const info = new PageInfo(PageTitle.none(), favicon);
	const entry = new SorzEntry(Sorz.register(address, info), SorzName.none());
	const json = entry.toJSON();

	const restored = SorzEntry.fromJSON(json);

	expect(restored.toJSON()).toEqual(json);
});
