import { beforeEach, expect, test } from "bun:test";
import type { Call } from "../../../src/call/Call.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { HmacTokenSigner } from "../../../src/infrastructure/crypto/HmacTokenSigner.ts";
import { ProtectedOperation } from "../../../src/operations/auth/ProtectedOperation.ts";
import type { OwnedHandler } from "../../../src/operations/OwnedHandler.ts";

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
	expect(await sut.reply()).toMatchObject({ body: { reached: true } });
});

test("hands the handler the user the token names", async () => {
	await sut.sendWithToken(sut.tokenOf("ana"));

	expect(sut.ownersServed()).toEqual(["ana"]);
});

test("serves nobody when the token is refused", async () => {
	await sut.sendWithToken(`${sut.tokenOf("ana")}x`);

	expect(sut.ownersServed()).toEqual([]);
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
	private readonly handler = new ReachedHandler();
	private readonly operation = new ProtectedOperation(
		this.handler,
		this.signer,
	);
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	validToken(): string {
		return this.tokenOf("xaviuzz");
	}

	tokenOf(name: string): string {
		return this.signer.sign(Username.from(name)).toString();
	}

	ownersServed(): string[] {
		return this.handler.owners();
	}

	async sendWithToken(token: string): Promise<void> {
		await this.sendWithHeader(`Bearer ${token}`);
	}

	async sendWithHeader(authorization: string): Promise<void> {
		await this.send({ authorization }, this.validCall());
	}

	async sendWithoutToken(): Promise<void> {
		await this.send({}, this.validCall());
	}

	async sendUnreadableWithoutToken(): Promise<void> {
		await this.send({}, "{not json");
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	async json(): Promise<unknown> {
		const json = await this.response.json();
		return json;
	}

	private validCall(): string {
		return JSON.stringify({ header: { callId: "p-1" } });
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

class ReachedHandler implements OwnedHandler {
	readonly name = "sources.list";
	private readonly served: string[] = [];

	async execute(_call: Call, owner: Username): Promise<unknown> {
		this.served.push(owner.toString());
		return { reached: true };
	}

	owners(): string[] {
		return [...this.served];
	}
}
