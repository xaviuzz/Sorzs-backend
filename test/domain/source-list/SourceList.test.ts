import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { AddressAlreadyRegisteredError } from "../../../src/domain/source-list/AddressAlreadyRegisteredError.ts";
import { NameTakenError } from "../../../src/domain/source-list/NameTakenError.ts";
import { SourceList } from "../../../src/domain/source-list/SourceList.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("a new list has no entries", () => {
	expect(sut.entries()).toEqual([]);
});

test("an added source appears with the user's name", () => {
	sut.add("https://example.com", "Docs");

	expect(sut.entries()).toEqual([
		{ address: "https://example.com", name: "Docs" },
	]);
});

test("entries come in order of addition", () => {
	sut.add("https://b.example.com", "Second");
	sut.add("https://a.example.com", "First");

	expect(sut.names()).toEqual(["Second", "First"]);
});

test("the added entry carries the identifier of its source", () => {
	const entry = sut.add("https://example.com", "Docs");

	expect(sut.identifiers()).toEqual([entry.toJSON().sourceId]);
});

test("refuses an address already in the list", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.com", "Other")).toThrow(
		AddressAlreadyRegisteredError,
	);
});

test("refuses a repeated address even with spaces around it", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add(" https://example.com ", "Other")).toThrow(
		AddressAlreadyRegisteredError,
	);
});

test("accepts addresses that differ by a trailing slash", () => {
	sut.add("https://example.com", "Docs");
	sut.add("https://example.com/", "Docs with slash");

	expect(sut.names()).toEqual(["Docs", "Docs with slash"]);
});

test("refuses a name already in the list", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.org", "Docs")).toThrow(NameTakenError);
});

test("refuses a repeated name ignoring letter case", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.org", "dOCS")).toThrow(NameTakenError);
});

test("refuses a repeated name even with spaces around it", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.org", "  Docs ")).toThrow(
		NameTakenError,
	);
});

test("the refusal is about the address when address and name are both repeated", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.com", "Docs")).toThrow(
		AddressAlreadyRegisteredError,
	);
});

test("a refusal changes nothing in the list", () => {
	sut.add("https://example.com", "Docs");

	expect(() => sut.add("https://example.com", "Other")).toThrow();
	expect(() => sut.add("https://example.org", "Docs")).toThrow();

	expect(sut.names()).toEqual(["Docs"]);
});

test("entries without a name coexist", () => {
	sut.addUnnamed("https://example.com");
	sut.addUnnamed("https://example.org");

	expect(sut.names()).toEqual([null, null]);
});

test("an entry without a name does not block a name", () => {
	sut.addUnnamed("https://example.com");
	sut.add("https://example.org", "Docs");

	expect(sut.names()).toEqual([null, "Docs"]);
});

test("still refuses a repeated name ignoring letter case beside unnamed entries", () => {
	sut.addUnnamed("https://example.com");
	sut.add("https://example.org", "Docs");

	expect(() => sut.add("https://example.net", "dOCS")).toThrow(NameTakenError);
});

test("its refusals carry their contract codes", () => {
	expect(new AddressAlreadyRegisteredError("x").code).toBe(
		"SOURCE_ALREADY_REGISTERED",
	);
	expect(new NameTakenError("x").code).toBe("SOURCE_NAME_TAKEN");
});

class SUT {
	private readonly list = new SourceList();

	add(address: string, name: string) {
		const source = Source.register(
			SourceAddress.from(address),
			PageInfo.none(),
		);
		return this.list.add(source, SourceName.from(name));
	}

	addUnnamed(address: string) {
		const source = Source.register(
			SourceAddress.from(address),
			PageInfo.none(),
		);
		return this.list.add(source, SourceName.none());
	}

	entries(): { address: string; name: string | null }[] {
		const described: { address: string; name: string | null }[] = [];
		for (const entry of this.list.entries()) {
			const { address, name } = entry.toJSON();
			described.push({ address, name });
		}
		return described;
	}

	names(): (string | null)[] {
		const names: (string | null)[] = [];
		for (const entry of this.list.entries()) {
			names.push(entry.toJSON().name);
		}
		return names;
	}

	identifiers(): string[] {
		const identifiers: string[] = [];
		for (const entry of this.list.entries()) {
			identifiers.push(entry.toJSON().sourceId);
		}
		return identifiers;
	}
}
