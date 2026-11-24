import { expect, test } from "bun:test";
import { Password } from "../../../src/domain/user/Password.ts";

test("matches the text it was made from", async () => {
	const sut = Password.hashing("p1casso");

	expect(await sut.matches("p1casso")).toBe(true);
});

test("hashed matches the text it was made from", async () => {
	const sut = await Password.hashed("p1casso");

	expect(await sut.matches("p1casso")).toBe(true);
});

test("hashed leaves the thread free while it works", async () => {
	let timerRan = false;
	setTimeout(() => {
		timerRan = true;
	}, 10);

	await Password.hashed("p1casso");

	expect(timerRan).toBe(true);
});

test("does not match another text", async () => {
	const sut = Password.hashing("p1casso");

	expect(await sut.matches("dali")).toBe(false);
});
