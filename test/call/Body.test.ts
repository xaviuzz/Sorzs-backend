import { expect, test } from "bun:test";
import { Body } from "../../src/call/Body.ts";
import { InvalidBodyError } from "../../src/call/InvalidBodyError.ts";
import { InvalidCallError } from "../../src/call/InvalidCallError.ts";

test("reads a required text field", () => {
	const body = Body.from({ name: "x" });

	expect(body.requireText("name")).toBe("x");
});

test("rejects a missing text field", () => {
	const body = Body.empty();

	expect(() => body.requireText("name")).toThrow(InvalidBodyError);
});

test("rejects a field that is not text", () => {
	const body = Body.from({ name: 7 });

	expect(() => body.requireText("name")).toThrow(InvalidBodyError);
});

test("names the missing field in the problem", () => {
	const body = Body.empty();

	expect(() => body.requireText("name")).toThrow("name is required");
});

test("reads an optional text field", () => {
	const body = Body.from({ name: "x" });

	expect(body.optionalText("name")).toBe("x");
});

test("an optional text field left out reads as empty", () => {
	const body = Body.empty();

	expect(body.optionalText("name")).toBe("");
});

test("rejects an optional field that is not text", () => {
	const body = Body.from({ name: 7 });

	expect(() => body.optionalText("name")).toThrow(InvalidBodyError);
});

test("rejects a body that is not an object", () => {
	expect(() => Body.from("hello")).toThrow(InvalidCallError);
	expect(() => Body.from(null)).toThrow(InvalidCallError);
});
