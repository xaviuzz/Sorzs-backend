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

test("an empty name given as optional means no name", () => {
	const name = SourceName.fromOptional("");

	expect(name.toJSON()).toBeNull();
});

test("an optional name of only spaces means no name", () => {
	const name = SourceName.fromOptional("    ");

	expect(name.toJSON()).toBeNull();
});

test("an optional name keeps the text it is given", () => {
	const name = SourceName.fromOptional("  Docs ");

	expect(name.toJSON()).toBe("Docs");
});

test("an optional name is still limited to 60 characters", () => {
	expect(() => SourceName.fromOptional("a".repeat(61))).toThrow(
		InvalidNameError,
	);
});

test("no name is equal to no other name", () => {
	const none = SourceName.none();

	expect(none.equals(SourceName.none())).toBe(false);
	expect(none.equals(SourceName.from("Docs"))).toBe(false);
	expect(SourceName.from("Docs").equals(none)).toBe(false);
});
