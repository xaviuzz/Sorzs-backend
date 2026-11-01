import { expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";

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

function entryWith(name: string, title: string): SourceEntry {
	const address = SourceAddress.from("https://example.com/docs");
	const info = new PageInfo(PageTitle.from(title), FaviconAddress.none());
	const source = Source.register(address, info);
	return new SourceEntry(source, SourceName.fromOptional(name));
}
