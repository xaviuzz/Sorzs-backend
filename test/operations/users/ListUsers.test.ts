import { beforeEach, expect, test } from "bun:test";
import { ListUsers } from "../../../src/operations/users/ListUsers.ts";
import { seededUsers, UsersCall } from "./UsersFixture.ts";

let sut: UsersCall;

beforeEach(() => {
	sut = new UsersCall(new ListUsers(seededUsers()));
});

test("is named users.list", () => {
	expect(new ListUsers(seededUsers()).name).toBe("users.list");
});

test("lists every user with their role in order of joining", async () => {
	await sut.send();

	expect(await sut.body()).toEqual({
		users: [
			{ username: "xaviuzz", role: "admin" },
			{ username: "ana", role: "user" },
		],
	});
});

test("carries neither a password nor a hash", async () => {
	await sut.send();

	const text = await sut.text();
	expect(text).not.toContain("password");
	expect(text).not.toContain("hash");
	expect(text).not.toContain("argon");
});
