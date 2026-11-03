import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AuthSettings } from "../src/operations/auth/AuthSettings.ts";
import { Server } from "../src/server.ts";
import { authEnvironment } from "./AuthEnvironment.ts";

let sut: SUT;

beforeAll(() => {
	sut = new SUT();
});

afterAll(() => sut.stop());

test("POST /health.check answers 200 ok end to end", async () => {
	await sut.callHealthCheck("e-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "e-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("a source added over HTTP shows in the list", async () => {
	await sut.logIn("e-0");
	await sut.addSource("e-2", "https://example.com", "Example");

	await sut.listSources("e-3");

	expect(await sut.reply()).toMatchObject({
		header: { callId: "e-3", status: "ok" },
		body: {
			sources: [{ name: "Example", address: "https://example.com" }],
		},
	});
});

test("each user lists only their own sources over HTTP", async () => {
	await sut.logInAs("e-6", "xaviuzz", "p1casso");
	await sut.addSource("e-7", "https://xaviuzz.example.com", "Mine");
	await sut.logInAs("e-8", "ana", "pueblos");

	await sut.listSources("e-9");

	expect(await sut.reply()).toMatchObject({ body: { sources: [] } });
});

test("a protected route answers 403 without a token", async () => {
	await sut.listSourcesWithoutToken("e-4");

	expect(sut.status()).toBe(403);
	expect(await sut.reply()).toEqual({
		code: "FORBIDDEN",
		message: "forbidden",
	});
});

test("the admin sees the sources of every list with their users over HTTP", async () => {
	await sut.logInAs("e-10", "xaviuzz", "p1casso");
	await sut.addSource("e-11", "https://common.example.com", "Common");
	await sut.logInAs("e-12", "ana", "pueblos");
	await sut.addSource("e-13", "https://common.example.com", "Common");
	await sut.logInAs("e-14", "xaviuzz", "p1casso");

	await sut.listSorzsSources("e-15");

	expect(await sut.reply()).toMatchObject({
		header: { callId: "e-15", status: "ok" },
		body: {
			sources: expect.arrayContaining([
				{ address: "https://common.example.com", favicon: null, users: 2 },
			]),
		},
	});
});

test("a plain user is refused the sorzs sources with 403", async () => {
	await sut.logInAs("e-16", "ana", "pueblos");

	await sut.listSorzsSources("e-17");

	expect(sut.status()).toBe(403);
	expect(await sut.reply()).toEqual({
		code: "FORBIDDEN",
		message: "forbidden",
	});
});

test("a call to the sorzs sources without a token is refused with 403", async () => {
	await sut.listSorzsSourcesWithoutToken("e-18");

	expect(sut.status()).toBe(403);
});

test("wrong credentials answer INVALID_CREDENTIALS over HTTP", async () => {
	await sut.logInWith("e-5", "xaviuzz", "dali");

	expect(await sut.reply()).toMatchObject({
		header: { callId: "e-5", status: "error" },
		body: { code: "INVALID_CREDENTIALS" },
	});
});

test("an unknown URL answers 404", async () => {
	await sut.callUnknownUrl();

	expect(sut.status()).toBe(404);
});

test("a GET to an operation URL answers 404", async () => {
	await sut.getOperationUrl();

	expect(sut.status()).toBe(404);
});

class SUT {
	private readonly dataDir = mkdtempSync(join(tmpdir(), "sorzs-"));
	private readonly server = Server.start(
		0,
		this.dataDir,
		AuthSettings.fromEnv(authEnvironment()),
	);
	private response = new Response();
	private token = "";

	async logIn(callId: string): Promise<void> {
		await this.logInAs(callId, "xaviuzz", "p1casso");
	}

	async logInAs(
		callId: string,
		username: string,
		password: string,
	): Promise<void> {
		await this.logInWith(callId, username, password);
		const reply = (await this.response.json()) as {
			body: { token?: string };
		};
		this.token = reply.body.token ?? "";
	}

	async logInWith(
		callId: string,
		username: string,
		password: string,
	): Promise<void> {
		const payload = JSON.stringify({
			header: { callId },
			body: { username, password },
		});
		await this.post("auth.login", payload);
	}

	async listSourcesWithoutToken(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		this.response = await fetch(`${this.server.url}sources.list`, {
			method: "POST",
			body: payload,
		});
	}

	async callHealthCheck(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("health.check", payload);
	}

	async addSource(
		callId: string,
		address: string,
		name: string,
	): Promise<void> {
		const payload = JSON.stringify({
			header: { callId },
			body: { address, name },
		});
		await this.post("sources.add", payload);
	}

	async listSources(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("sources.list", payload);
	}

	async listSorzsSources(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("sorzs.sources", payload);
	}

	async listSorzsSourcesWithoutToken(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		this.response = await fetch(`${this.server.url}sorzs.sources`, {
			method: "POST",
			body: payload,
		});
	}

	async callUnknownUrl(): Promise<void> {
		await this.post("nothing.here", "{}");
	}

	async getOperationUrl(): Promise<void> {
		this.response = await fetch(`${this.server.url}health.check`);
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	stop(): void {
		this.server.stop();
		rmSync(this.dataDir, { recursive: true, force: true });
	}

	private async post(path: string, payload: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${path}`, {
			method: "POST",
			headers: { authorization: `Bearer ${this.token}` },
			body: payload,
		});
	}
}
