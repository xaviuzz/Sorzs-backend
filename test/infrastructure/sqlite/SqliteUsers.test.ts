import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Password } from "../../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../../src/domain/user/RegisteredUser.ts";
import { Role } from "../../../src/domain/user/Role.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { MigratedDatabaseFactory } from "../../../src/infrastructure/sqlite/MigratedDatabaseFactory.ts";
import { SqliteUsers } from "../../../src/infrastructure/sqlite/SqliteUsers.ts";
import { behavesAsUsers } from "../UsersBehavior.ts";

behavesAsUsers(
	(registered) =>
		new SqliteUsers(MigratedDatabaseFactory.standard().inMemory(), registered),
);

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps users, passwords and roles when the file is opened again", async () => {
	const first = new SqliteUsers(
		MigratedDatabaseFactory.standard().inFolder(folder),
		[admin("xaviuzz", "p1casso")],
	);
	await first.add(user("ana", "pueblos"));
	await first.setRole(Username.from("ana"), Role.admin());

	const second = new SqliteUsers(
		MigratedDatabaseFactory.standard().inFolder(folder),
		[],
	);
	const listed = await second.list();
	const found = await second.find(Username.from("ana"));

	expect(listed.map((each) => each.toJSON())).toEqual([
		{ username: "xaviuzz", role: "admin" },
		{ username: "ana", role: "admin" },
	]);
	expect(await found.accepts("pueblos")).toBe(true);
});

test("the seed adds only the missing users and leaves an existing role", async () => {
	const first = new SqliteUsers(
		MigratedDatabaseFactory.standard().inFolder(folder),
		[admin("xaviuzz", "p1casso"), user("ana", "pueblos")],
	);
	await first.setRole(Username.from("ana"), Role.admin());
	await first.setRole(Username.from("xaviuzz"), Role.user());

	const second = new SqliteUsers(
		MigratedDatabaseFactory.standard().inFolder(folder),
		[admin("xaviuzz", "other"), user("ana", "other"), user("dali", "relojes")],
	);
	const listed = await second.list();
	const found = await second.find(Username.from("xaviuzz"));

	expect(listed.map((each) => each.toJSON())).toEqual([
		{ username: "xaviuzz", role: "user" },
		{ username: "ana", role: "admin" },
		{ username: "dali", role: "user" },
	]);
	expect(await found.accepts("p1casso")).toBe(true);
});

function admin(name: string, password: string): RegisteredUser {
	return new RegisteredUser(
		Username.from(name),
		Password.hashing(password),
		Role.admin(),
	);
}

function user(name: string, password: string): RegisteredUser {
	return new RegisteredUser(Username.from(name), Password.hashing(password));
}
