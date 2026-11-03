import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import type { InMemoryUsers } from "../../../src/infrastructure/memory/InMemoryUsers.ts";
import { SetRole } from "../../../src/operations/users/SetRole.ts";
import { seededUsers, UsersCall } from "./UsersFixture.ts";

let users: InMemoryUsers;
let sut: UsersCall;

beforeEach(() => {
	users = seededUsers();
	sut = new UsersCall(new SetRole(users));
});

test("is named users.setRole", () => {
	expect(new SetRole(users).name).toBe("users.setRole");
});

test("changes the role and answers the username with the new role", async () => {
	await sut.send({ username: "ana", role: "admin" });

	expect(await sut.body()).toEqual({ username: "ana", role: "admin" });
	const found = await users.find(Username.from("ana"));
	expect(found.role().toString()).toBe("admin");
});

test("answers LAST_ADMIN when it would leave no admin", async () => {
	await sut.send({ username: "xaviuzz", role: "user" });

	expect(await sut.body()).toEqual({
		code: "LAST_ADMIN",
		message: "Sorzs must keep at least one admin",
	});
});

test("answers INVALID_BODY for an unknown username", async () => {
	await sut.send({ username: "dali", role: "admin" });

	expect(await sut.body()).toEqual({
		code: "INVALID_BODY",
		message: "there is no user with that username",
	});
});

test("answers INVALID_BODY for an unknown role", async () => {
	await sut.send({ username: "ana", role: "root" });

	expect(await sut.body()).toEqual({
		code: "INVALID_BODY",
		message: "role must be admin or user",
	});
});

test.each(["username", "role"])(
	"answers INVALID_BODY when %s is missing",
	async (field) => {
		const body: Record<string, string> = { username: "ana", role: "admin" };
		delete body[field];

		await sut.send(body);

		expect(await sut.body()).toEqual({
			code: "INVALID_BODY",
			message: `${field} is required`,
		});
	},
);
