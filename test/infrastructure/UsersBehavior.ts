import { beforeEach, expect, test } from "bun:test";
import { Password } from "../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../src/domain/user/RegisteredUser.ts";
import { Username } from "../../src/domain/user/Username.ts";
import type { Users } from "../../src/domain/user/Users.ts";

export function behavesAsUsers(
	create: (registered: RegisteredUser[]) => Users,
): void {
	let sut: Users;

	beforeEach(() => {
		const xaviuzz = new RegisteredUser(
			Username.from("xaviuzz"),
			Password.hashing("p1casso"),
		);
		sut = create([xaviuzz]);
	});

	test("finds a registered user by name", async () => {
		const found = await sut.find(Username.from("xaviuzz"));

		expect(await found.accepts("p1casso")).toBe(true);
	});

	test("finds nobody under an unknown name", async () => {
		const found = await sut.find(Username.from("dali"));

		expect(await found.accepts("p1casso")).toBe(false);
	});
}
