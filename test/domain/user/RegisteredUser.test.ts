import { expect, test } from "bun:test";
import { NoUser } from "../../../src/domain/user/NoUser.ts";
import { Password } from "../../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../../src/domain/user/RegisteredUser.ts";
import { Username } from "../../../src/domain/user/Username.ts";

test("accepts its own password", async () => {
	const sut = new RegisteredUser(
		Username.from("xaviuzz"),
		Password.hashing("p1casso"),
	);

	expect(await sut.accepts("p1casso")).toBe(true);
});

test("refuses another password", async () => {
	const sut = new RegisteredUser(
		Username.from("xaviuzz"),
		Password.hashing("p1casso"),
	);

	expect(await sut.accepts("dali")).toBe(false);
});

test("no user accepts nothing", async () => {
	const sut = new NoUser();

	expect(await sut.accepts("")).toBe(false);
});
