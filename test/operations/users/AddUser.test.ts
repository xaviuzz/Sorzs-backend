import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import type { InMemoryUsers } from "../../../src/infrastructure/memory/InMemoryUsers.ts";
import { AddUser } from "../../../src/operations/users/AddUser.ts";
import { seededUsers, UsersCall } from "./UsersFixture.ts";

let users: InMemoryUsers;
let sut: UsersCall;

beforeEach(() => {
	users = seededUsers();
	sut = new UsersCall(new AddUser(users));
});

test("is named users.add", () => {
	expect(new AddUser(users).name).toBe("users.add");
});

test("adds a user and answers their username and role", async () => {
	await sut.send({ username: "dali", password: "relojes", role: "admin" });

	expect(await sut.body()).toEqual({ username: "dali", role: "admin" });
	const found = await users.find(Username.from("dali"));
	expect(await found.accepts("relojes")).toBe(true);
	expect(found.role().toString()).toBe("admin");
});

test("never answers the password", async () => {
	await sut.send({ username: "dali", password: "relojes", role: "user" });

	expect(await sut.text()).not.toContain("relojes");
});

test("answers USERNAME_TAKEN for a username already taken", async () => {
	await sut.send({ username: "ana", password: "other", role: "user" });

	expect(await sut.body()).toEqual({
		code: "USERNAME_TAKEN",
		message: "that username is already taken",
	});
});

test("answers INVALID_BODY for an unknown role", async () => {
	await sut.send({ username: "dali", password: "relojes", role: "root" });

	expect(await sut.body()).toEqual({
		code: "INVALID_BODY",
		message: "role must be admin or user",
	});
	expect(await users.list()).toHaveLength(2);
});

test.each(["username", "password", "role"])(
	"answers INVALID_BODY when %s is missing",
	async (field) => {
		const body: Record<string, string> = {
			username: "dali",
			password: "relojes",
			role: "user",
		};
		delete body[field];

		await sut.send(body);

		expect(await sut.body()).toEqual({
			code: "INVALID_BODY",
			message: `${field} is required`,
		});
	},
);

test.each([
	["username", ""],
	["username", "   "],
	["password", ""],
	["password", "   "],
])("answers INVALID_BODY when %s is blank (%j)", async (field, blank) => {
	const body: Record<string, string> = {
		username: "dali",
		password: "relojes",
		role: "user",
		[field]: blank,
	};

	await sut.send(body);

	expect(await sut.body()).toEqual({
		code: "INVALID_BODY",
		message: `${field} must not be blank`,
	});
	expect(await users.list()).toHaveLength(2);
});
