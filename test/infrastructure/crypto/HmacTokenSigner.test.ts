import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import { HmacTokenSigner } from "../../../src/infrastructure/crypto/HmacTokenSigner.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("recognizes a token it signed", () => {
	const token = sut.tokenFor("xaviuzz");

	expect(sut.recognizes(token)).toBe(true);
});

test("refuses a token from another secret", () => {
	const token = sut.tokenFromAnotherSecret("xaviuzz");

	expect(sut.recognizes(token)).toBe(false);
});

test("refuses a token whose user was altered", () => {
	const token = sut.tokenWithForgedUser("xaviuzz", "dali");

	expect(sut.recognizes(token)).toBe(false);
});

test("names the user a token was signed for", () => {
	const token = sut.tokenFor("ana");

	expect(sut.userOf(token)).toBe("ana");
});

test("refuses text that is not a token", () => {
	expect(sut.recognizes("")).toBe(false);
	expect(sut.recognizes("abc")).toBe(false);
	expect(sut.recognizes("a.b.c")).toBe(false);
});

class SUT {
	private readonly signer = new HmacTokenSigner("secret");
	private readonly another = new HmacTokenSigner("another secret");

	tokenFor(name: string): string {
		return this.signer.sign(Username.from(name)).toString();
	}

	tokenFromAnotherSecret(name: string): string {
		return this.another.sign(Username.from(name)).toString();
	}

	tokenWithForgedUser(name: string, forged: string): string {
		const signature = this.tokenFor(name).split(".")[1];
		const forgedUser = Buffer.from(forged).toString("base64url");
		return `${forgedUser}.${signature}`;
	}

	userOf(raw: string): string {
		return this.signer.userOf(raw).toString();
	}

	recognizes(raw: string): boolean {
		return this.signer.recognizes(raw);
	}
}
