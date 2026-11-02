import { beforeEach, expect, test } from "bun:test";
import { Password } from "../../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../../src/domain/user/RegisteredUser.ts";
import { Role } from "../../../src/domain/user/Role.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { HmacTokenSigner } from "../../../src/infrastructure/crypto/HmacTokenSigner.ts";
import { InMemoryUsers } from "../../../src/infrastructure/memory/InMemoryUsers.ts";
import { AuthLogin } from "../../../src/operations/auth/AuthLogin.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named auth.login", () => {
	expect(sut.operationName()).toBe("auth.login");
});

test("answers a token the signer recognizes for good credentials", async () => {
	await sut.login("xaviuzz", "p1casso");

	expect(sut.status()).toBe(200);
	expect(await sut.replyStatus()).toBe("ok");
	expect(sut.recognizes(await sut.token())).toBe(true);
});

test("answers the admin role for an admin", async () => {
	await sut.login("xaviuzz", "p1casso");

	expect(await sut.role()).toBe("admin");
});

test("answers the user role for a user", async () => {
	await sut.login("ana", "pueblos");

	expect(await sut.role()).toBe("user");
});

test("answers INVALID_CREDENTIALS for a wrong password", async () => {
	await sut.login("xaviuzz", "dali");

	expect(await sut.body()).toEqual({
		code: "INVALID_CREDENTIALS",
		message: "invalid credentials",
	});
});

test("answers the same refusal for an unknown user", async () => {
	await sut.login("dali", "p1casso");

	expect(await sut.body()).toEqual({
		code: "INVALID_CREDENTIALS",
		message: "invalid credentials",
	});
});

test("answers INVALID_BODY when the password is missing", async () => {
	await sut.loginWithoutPassword("xaviuzz");

	expect(await sut.body()).toEqual({
		code: "INVALID_BODY",
		message: "password is required",
	});
});

class SUT {
	private readonly signer = new HmacTokenSigner("secret");
	private readonly operation = new JsonOperation(
		new AuthLogin(
			new InMemoryUsers([
				new RegisteredUser(
					Username.from("xaviuzz"),
					Password.hashing("p1casso"),
					Role.admin(),
				),
				new RegisteredUser(Username.from("ana"), Password.hashing("pueblos")),
			]),
			this.signer,
		),
	);
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	async login(username: string, password: string): Promise<void> {
		await this.send({ username, password });
	}

	async loginWithoutPassword(username: string): Promise<void> {
		await this.send({ username });
	}

	recognizes(token: string): boolean {
		return this.signer.recognizes(token);
	}

	status(): number {
		return this.response.status;
	}

	async replyStatus(): Promise<string> {
		const reply = (await this.response.clone().json()) as {
			header: { status: string };
		};
		return reply.header.status;
	}

	async token(): Promise<string> {
		const body = (await this.body()) as { token: string };
		return body.token;
	}

	async role(): Promise<string> {
		const body = (await this.body()) as { role: string };
		return body.role;
	}

	async body(): Promise<unknown> {
		const reply = (await this.response.clone().json()) as { body: unknown };
		return reply.body;
	}

	private async send(body: object): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "l-1" }, body });
		const request = new Request("http://x/auth.login", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}
}
