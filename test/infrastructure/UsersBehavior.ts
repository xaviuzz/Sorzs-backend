import { expect, test } from "bun:test";
import { LastAdminError } from "../../src/domain/user/LastAdminError.ts";
import { Password } from "../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../src/domain/user/RegisteredUser.ts";
import { Role } from "../../src/domain/user/Role.ts";
import { UnknownUserError } from "../../src/domain/user/UnknownUserError.ts";
import { Username } from "../../src/domain/user/Username.ts";
import { UsernameTakenError } from "../../src/domain/user/UsernameTakenError.ts";
import type { Users } from "../../src/domain/user/Users.ts";

export function behavesAsUsers(
	create: (registered: RegisteredUser[]) => Users,
): void {
	test("finds a registered user by name", async () => {
		const sut = create([admin("xaviuzz", "p1casso")]);

		const found = await sut.find(Username.from("xaviuzz"));

		expect(await found.accepts("p1casso")).toBe(true);
	});

	test("finds nobody under an unknown name", async () => {
		const sut = create([admin("xaviuzz", "p1casso")]);

		const found = await sut.find(Username.from("dali"));

		expect(await found.accepts("p1casso")).toBe(false);
	});

	test("lists every user with their role in order of joining", async () => {
		const sut = create([admin("xaviuzz", "p1casso"), user("ana", "pueblos")]);

		const listed = await sut.list();

		expect(listed.map((each) => each.toJSON())).toEqual([
			{ username: "xaviuzz", role: "admin" },
			{ username: "ana", role: "user" },
		]);
	});

	test("an added user is listed last and enters with their password", async () => {
		const sut = create([admin("xaviuzz", "p1casso")]);

		await sut.add(user("ana", "pueblos"));

		const listed = await sut.list();
		const found = await sut.find(Username.from("ana"));
		expect(listed.map((each) => each.toJSON().username)).toEqual([
			"xaviuzz",
			"ana",
		]);
		expect(await found.accepts("pueblos")).toBe(true);
	});

	test("refuses to add a username already taken and adds nothing", async () => {
		const sut = create([admin("xaviuzz", "p1casso")]);

		const adding = sut.add(user("xaviuzz", "other"));

		await expect(adding).rejects.toBeInstanceOf(UsernameTakenError);
		expect(await sut.list()).toHaveLength(1);
	});

	test("upper and lower case make different usernames", async () => {
		const sut = create([user("ana", "pueblos")]);

		await sut.add(user("Ana", "other"));

		expect(await sut.list()).toHaveLength(2);
	});

	test("changes the role of a user", async () => {
		const sut = create([admin("xaviuzz", "p1casso"), user("ana", "pueblos")]);

		await sut.setRole(Username.from("ana"), Role.admin());

		const found = await sut.find(Username.from("ana"));
		const listed = await sut.list();
		expect(found.role().toString()).toBe("admin");
		expect(listed.map((each) => each.toJSON().role)).toEqual([
			"admin",
			"admin",
		]);
	});

	test("an admin may make themself a user while another admin remains", async () => {
		const sut = create([admin("xaviuzz", "p1casso"), admin("ana", "pueblos")]);

		await sut.setRole(Username.from("xaviuzz"), Role.user());

		const found = await sut.find(Username.from("xaviuzz"));
		expect(found.role().toString()).toBe("user");
	});

	test("refuses to make the last admin a user and changes nothing", async () => {
		const sut = create([admin("xaviuzz", "p1casso"), user("ana", "pueblos")]);

		const changing = sut.setRole(Username.from("xaviuzz"), Role.user());

		await expect(changing).rejects.toBeInstanceOf(LastAdminError);
		const found = await sut.find(Username.from("xaviuzz"));
		expect(found.role().toString()).toBe("admin");
	});

	test("refuses to change the role of an unknown user", async () => {
		const sut = create([admin("xaviuzz", "p1casso")]);

		const changing = sut.setRole(Username.from("dali"), Role.admin());

		await expect(changing).rejects.toBeInstanceOf(UnknownUserError);
	});
}

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
