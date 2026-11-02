import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import { AuthSettings } from "../../../src/operations/auth/AuthSettings.ts";
import { authEnvironment } from "../../AuthEnvironment.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("seeds the user from the environment", async () => {
	expect(await sut.acceptsLogin("xaviuzz", "p1casso")).toBe(true);
});

test("signs with the secret from the environment", () => {
	expect(sut.recognizesItsOwnToken("xaviuzz")).toBe(true);
});

test("refuses to start without AUTH_SECRET", () => {
	expect(() => sut.startWithout("AUTH_SECRET")).toThrow(
		"AUTH_SECRET is required",
	);
});

test("refuses to start without SEED_USER", () => {
	expect(() => sut.startWithout("SEED_USER")).toThrow("SEED_USER is required");
});

test("refuses to start with an empty SEED_PASSWORD", () => {
	expect(() => sut.startWithEmpty("SEED_PASSWORD")).toThrow(
		"SEED_PASSWORD is required",
	);
});

class SUT {
	private readonly settings = AuthSettings.fromEnv(authEnvironment());

	async acceptsLogin(name: string, password: string): Promise<boolean> {
		const user = await this.settings.users().find(Username.from(name));
		const accepted = await user.accepts(password);
		return accepted;
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

	startWithEmpty(setting: string): AuthSettings {
		const environment = { ...authEnvironment(), [setting]: "" };
		return AuthSettings.fromEnv(environment);
	}
}
