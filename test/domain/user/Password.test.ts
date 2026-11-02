import { expect, test } from "bun:test";
import { Password } from "../../../src/domain/user/Password.ts";

test("matches the text it was made from", async () => {
	const sut = Password.hashing("p1casso");

	expect(await sut.matches("p1casso")).toBe(true);
});

test("does not match another text", async () => {
	const sut = Password.hashing("p1casso");

	expect(await sut.matches("dali")).toBe(false);
});
