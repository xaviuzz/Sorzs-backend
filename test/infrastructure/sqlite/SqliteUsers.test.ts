import { afterEach, beforeEach, expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Password } from "../../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../../src/domain/user/RegisteredUser.ts";
import { Role } from "../../../src/domain/user/Role.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { SqliteUsers } from "../../../src/infrastructure/sqlite/SqliteUsers.ts";
import { UnreadableUsersError } from "../../../src/infrastructure/sqlite/UnreadableUsersError.ts";
import { behavesAsUsers } from "../UsersBehavior.ts";

behavesAsUsers((registered) => new SqliteUsers(":memory:", registered));

let folder: string;

beforeEach(() => {
	folder = mkdtempSync(join(tmpdir(), "sorzs-"));
});

afterEach(() => {
	rmSync(folder, { recursive: true, force: true });
});

test("keeps users, passwords and roles when the file is opened again", async () => {
	const path = join(folder, "sorzs.db");
	const first = new SqliteUsers(path, [admin("xaviuzz", "p1casso")]);
	await first.add(user("ana", "pueblos"));
	await first.setRole(Username.from("ana"), Role.admin());

	const second = new SqliteUsers(path, []);
	const listed = await second.list();
	const found = await second.find(Username.from("ana"));

	expect(listed.map((each) => each.toJSON())).toEqual([
		{ username: "xaviuzz", role: "admin" },
		{ username: "ana", role: "admin" },
	]);
	expect(await found.accepts("pueblos")).toBe(true);
});

test("the seed adds only the missing users and leaves an existing role", async () => {
	const path = join(folder, "sorzs.db");
	const first = new SqliteUsers(path, [
		admin("xaviuzz", "p1casso"),
		user("ana", "pueblos"),
	]);
	await first.setRole(Username.from("ana"), Role.admin());
	await first.setRole(Username.from("xaviuzz"), Role.user());

	const second = new SqliteUsers(path, [
		admin("xaviuzz", "other"),
		user("ana", "other"),
		user("dali", "relojes"),
	]);
	const listed = await second.list();
	const found = await second.find(Username.from("xaviuzz"));

	expect(listed.map((each) => each.toJSON())).toEqual([
		{ username: "xaviuzz", role: "user" },
		{ username: "ana", role: "admin" },
		{ username: "dali", role: "user" },
	]);
	expect(await found.accepts("p1casso")).toBe(true);
});

test("keeps the users in sorzs.db inside a folder it creates when missing", async () => {
	const dataDir = join(folder, "nested", "data");
	const first = SqliteUsers.inFolder(dataDir, [admin("xaviuzz", "p1casso")]);
	await first.add(user("ana", "pueblos"));

	const second = SqliteUsers.inFolder(dataDir, []);
	const listed = await second.list();

	expect(listed.map((each) => each.toJSON().username)).toEqual([
		"xaviuzz",
		"ana",
	]);
	expect(existsSync(join(dataDir, "sorzs.db"))).toBe(true);
});

test("a file that is not a database stops the opening and stays as it was", () => {
	const path = join(folder, "sorzs.db");
	writeFileSync(path, "this is not a database, it is long enough to be read");
	const before = readFileSync(path);

	const opening = () => new SqliteUsers(path, [admin("xaviuzz", "p1casso")]);

	expect(opening).toThrow(UnreadableUsersError);
	expect(readFileSync(path)).toEqual(before);
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
