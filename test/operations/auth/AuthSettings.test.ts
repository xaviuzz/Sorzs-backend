import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import { AuthSettings } from "../../../src/operations/auth/AuthSettings.ts";
import { authEnvironment } from "../../AuthEnvironment.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("seeds every user from the environment", async () => {
	expect(await sut.acceptsLogin("xaviuzz", "p1casso")).toBe(true);
	expect(await sut.acceptsLogin("ana", "pueblos")).toBe(true);
});

test("a password belongs to its own user", async () => {
	expect(await sut.acceptsLogin("ana", "p1casso")).toBe(false);
});

test("a seeded user carries the role written after the password", async () => {
	expect(await sut.roleOf("xaviuzz")).toBe("admin");
});

test("a seeded user without a role is a user", async () => {
	expect(await sut.roleOf("ana")).toBe("user");
});

test("refuses to start with an unknown role in SEED_USERS", () => {
	expect(() => sut.startWithUsers("xaviuzz:p1casso:root")).toThrow(
		"SEED_USERS must be username:password[:role] pairs separated by commas, role being admin or user",
	);
});

test("signs with the secret from the environment", () => {
	expect(sut.recognizesItsOwnToken("xaviuzz")).toBe(true);
});

test("refuses to start without AUTH_SECRET", () => {
	expect(() => sut.startWithout("AUTH_SECRET")).toThrow(
		"AUTH_SECRET is required",
	);
});

test("refuses to start without SEED_USERS", () => {
	expect(() => sut.startWithout("SEED_USERS")).toThrow(
		"SEED_USERS is required",
	);
});

test("refuses to start with an empty SEED_USERS", () => {
	expect(() => sut.startWithEmpty("SEED_USERS")).toThrow(
		"SEED_USERS is required",
	);
});

test.each([
	["a pair with no password", "xaviuzz"],
	["a pair with an empty password", "xaviuzz:"],
	["a pair with an empty username", ":p1casso"],
	["an empty pair between commas", "xaviuzz:p1casso,,ana:pueblos"],
])("refuses to start with %s in SEED_USERS", (_title, users) => {
	expect(() => sut.startWithUsers(users)).toThrow(
		"SEED_USERS must be username:password[:role] pairs separated by commas, role being admin or user",
	);
});

class SUT {
	private readonly settings = AuthSettings.fromEnv(authEnvironment());

	async acceptsLogin(name: string, password: string): Promise<boolean> {
		const user = await this.settings.users().find(Username.from(name));
		const accepted = await user.accepts(password);
		return accepted;
	}

	async roleOf(name: string): Promise<string> {
		const user = await this.settings.users().find(Username.from(name));
		return user.role().toString();
	}

	recognizesItsOwnToken(name: string): boolean {
		const signer = this.settings.signer();
		const token = signer.sign(Username.from(name));
		return signer.recognizes(token.toString());
	}

	startWithout(setting: string): AuthSettings {
		const environment = { ...authEnvironment(), [setting]: undefined };
		return AuthSettings.fromEnv(environment);
	}

	startWithUsers(users: string): AuthSettings {
		const environment = { ...authEnvironment(), SEED_USERS: users };
		return AuthSettings.fromEnv(environment);
	}

	startWithEmpty(setting: string): AuthSettings {
		const environment = { ...authEnvironment(), [setting]: "" };
		return AuthSettings.fromEnv(environment);
	}
}
