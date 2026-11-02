import { beforeEach, expect, test } from "bun:test";
import { Username } from "../../../src/domain/user/Username.ts";
import { HmacTokenSigner } from "../../../src/infrastructure/crypto/HmacTokenSigner.ts";
import { ProtectedOperation } from "../../../src/operations/auth/ProtectedOperation.ts";
import type { Operation } from "../../../src/operations/Operation.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named like the operation it protects", () => {
	expect(sut.operationName()).toBe("sources.list");
});

test("serves a request with a valid token", async () => {
	await sut.sendWithToken(sut.validToken());

	expect(sut.status()).toBe(200);
	expect(await sut.text()).toBe("reached");
});

test("answers 403 FORBIDDEN without a token", async () => {
	await sut.sendWithoutToken();

	expect(sut.status()).toBe(403);
	expect(await sut.json()).toEqual({
		code: "FORBIDDEN",
		message: "forbidden",
	});
});

test("answers 403 when the header is not a bearer token", async () => {
	await sut.sendWithHeader(`Basic ${sut.validToken()}`);

	expect(sut.status()).toBe(403);
});

test("answers 403 when the bearer token is empty", async () => {
	await sut.sendWithHeader("Bearer ");

	expect(sut.status()).toBe(403);
});

test("answers 403 when the token was altered", async () => {
	await sut.sendWithToken(`${sut.validToken()}x`);

	expect(sut.status()).toBe(403);
});

test("answers 403 before reading a call that is not JSON", async () => {
	await sut.sendUnreadableWithoutToken();

	expect(sut.status()).toBe(403);
});

class SUT {
	private readonly signer = new HmacTokenSigner("secret");
	private readonly operation = new ProtectedOperation(
		new ReachedOperation(),
		this.signer,
	);
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	validToken(): string {
		return this.signer.sign(Username.from("xaviuzz")).toString();
	}

	async sendWithToken(token: string): Promise<void> {
		await this.sendWithHeader(`Bearer ${token}`);
	}

	async sendWithHeader(authorization: string): Promise<void> {
		await this.send({ authorization }, "{}");
	}

	async sendWithoutToken(): Promise<void> {
		await this.send({}, "{}");
	}

	async sendUnreadableWithoutToken(): Promise<void> {
		await this.send({}, "{not json");
	}

	status(): number {
		return this.response.status;
	}

	async text(): Promise<string> {
		const text = await this.response.text();
		return text;
	}

	async json(): Promise<unknown> {
		const json = await this.response.json();
		return json;
	}

	private async send(headers: HeadersInit, body: string): Promise<void> {
		const request = new Request("http://x/sources.list", {
			method: "POST",
			headers,
			body,
		});
		this.response = await this.operation.serve(request);
	}
}

class ReachedOperation implements Operation {
	readonly name = "sources.list";

	async serve(): Promise<Response> {
		return new Response("reached");
	}
}
