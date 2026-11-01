import { expect, test } from "bun:test";
import { InvalidQueryError } from "../../../src/domain/search/InvalidQueryError.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";

test("keeps the text it was written with", () => {
	const query = SearchQuery.from("rust lifetimes");

	expect(query.toString()).toBe("rust lifetimes");
});

test("removes spaces at both ends", () => {
	const query = SearchQuery.from("  rust lifetimes  ");

	expect(query.toString()).toBe("rust lifetimes");
});

test("accepts a query of 200 characters", () => {
	const query = SearchQuery.from("a".repeat(200));

	expect(query.toString()).toBe("a".repeat(200));
});

test("refuses an empty query", () => {
	expect(() => SearchQuery.from("")).toThrow(InvalidQueryError);
});

test("refuses a blank query", () => {
	expect(() => SearchQuery.from("   ")).toThrow(InvalidQueryError);
});

test("refuses a query of more than 200 characters", () => {
	expect(() => SearchQuery.from("a".repeat(201))).toThrow(InvalidQueryError);
});

test("counts the characters after removing the spaces", () => {
	const query = SearchQuery.from(` ${"a".repeat(200)} `);

	expect(query.toString()).toBe("a".repeat(200));
});

test("its refusal carries the invalid body code", () => {
	const refusal = new InvalidQueryError("bad");

	expect(refusal.code).toBe("INVALID_BODY");
});
