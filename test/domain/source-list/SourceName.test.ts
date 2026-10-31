import { expect, test } from "bun:test";
import { InvalidNameError } from "../../../src/domain/source-list/InvalidNameError.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";

test("keeps the name it is given", () => {
	const name = SourceName.from("Docs");

	expect(name.toString()).toBe("Docs");
});

test("removes spaces at both ends", () => {
	const name = SourceName.from("  Docs  ");

	expect(name.toString()).toBe("Docs");
});

test("refuses an empty name", () => {
	expect(() => SourceName.from("")).toThrow(InvalidNameError);
});

test("refuses a name of only spaces", () => {
	expect(() => SourceName.from("    ")).toThrow(InvalidNameError);
});

test("accepts a name of 60 characters", () => {
	const name = SourceName.from("a".repeat(60));

	expect(name.toString()).toBe("a".repeat(60));
});

test("refuses a name of 61 characters", () => {
	expect(() => SourceName.from("a".repeat(61))).toThrow(InvalidNameError);
});

test("counts the characters after removing spaces", () => {
	const name = SourceName.from(` ${"a".repeat(60)} `);

	expect(name.toString()).toBe("a".repeat(60));
});

test("names that differ only in letter case are equal", () => {
	const first = SourceName.from("Docs");
	const second = SourceName.from("dOCS");

	expect(first.equals(second)).toBe(true);
});

test("different names are not equal", () => {
	const first = SourceName.from("Docs");
	const second = SourceName.from("News");

	expect(first.equals(second)).toBe(false);
});

test("its refusal carries the invalid body code", () => {
	const refusal = new InvalidNameError("bad");

	expect(refusal.code).toBe("INVALID_BODY");
});
