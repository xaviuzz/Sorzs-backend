import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HttpPageReader } from "../src/infrastructure/http/HttpPageReader.ts";
import { AuthSettings } from "../src/operations/auth/AuthSettings.ts";
import { StaticSettings } from "../src/operations/settings/StaticSettings.ts";
import { SearchSettings } from "../src/operations/sorzs/SearchSettings.ts";
import { Server } from "../src/server.ts";
import { serverEnvironment } from "./ServerEnvironment.ts";

let sut: SUT;
let sutServingFiles: SUT;

beforeAll(() => {
	sut = new SUT();
	sutServingFiles = SUT.servingFiles();
});

afterAll(() => {
	sut.stop();
	sutServingFiles.stop();
});

test("POST /health.check answers 200 ok end to end", async () => {
	await sut.callHealthCheck("e-1");

	expect(sut.status()).toBe(200);
	expect(await sut.reply()).toEqual({
		header: { callId: "e-1", status: "ok" },
		body: { status: "ok" },
	});
});

test("a sorz added over HTTP shows in the list", async () => {
	await sut.logIn("e-0");
	await sut.addSorz("e-2", "https://example.com", "Example");

	await sut.listSorzs("e-3");

	expect(await sut.reply()).toMatchObject({
		header: { callId: "e-3", status: "ok" },
		body: {
			sorzs: [{ name: "Example", address: "https://example.com" }],
		},
	});
});

test("each user lists only their own sorzs over HTTP", async () => {
	await sut.logInAs("e-6", "xaviuzz", "p1casso");
	await sut.addSorz("e-7", "https://xaviuzz.example.com", "Mine");
	await sut.logInAs("e-8", "ana", "pueblos");

	await sut.listSorzs("e-9");

	expect(await sut.reply()).toMatchObject({ body: { sorzs: [] } });
});

test("a protected route answers 403 without a token", async () => {
	await sut.listSorzsWithoutToken("e-4");

	expect(sut.status()).toBe(403);
	expect(await sut.reply()).toEqual({
		code: "FORBIDDEN",
		message: "forbidden",
	});
});

test("the admin sees the sorzs of every list with their users over HTTP", async () => {
	await sut.logInAs("e-10", "xaviuzz", "p1casso");
	await sut.addSorz("e-11", "https://common.example.com", "Common");
	await sut.logInAs("e-12", "ana", "pueblos");
	await sut.addSorz("e-13", "https://common.example.com", "Common");
	await sut.logInAs("e-14", "xaviuzz", "p1casso");

	await sut.readCensus("e-15");

	expect(await sut.reply()).toMatchObject({
		header: { callId: "e-15", status: "ok" },
		body: {
			sorzs: expect.arrayContaining([
				{
					address: "https://common.example.com",
					favicon: null,
					provider: "generic",
					providerName: "Generic",
					users: 2,
				},
			]),
		},
	});
});

test("a plain user is refused the census with 403", async () => {
	await sut.logInAs("e-16", "ana", "pueblos");

	await sut.readCensus("e-17");

	expect(sut.status()).toBe(403);
	expect(await sut.reply()).toEqual({
		code: "FORBIDDEN",
		message: "forbidden",
	});
});

test("a call to the census without a token is refused with 403", async () => {
	await sut.censusWithoutToken("e-18");

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

test("without STATIC_DIR a GET to an unknown URL answers 404", async () => {
	await sut.getPath("/anything/at/all");

	expect(sut.status()).toBe(404);
});

test("a GET of an existing file returns it with its content type", async () => {
	await sutServingFiles.getPath("/app.js");

	expect(sutServingFiles.status()).toBe(200);
	expect(sutServingFiles.contentType()).toContain("javascript");
	expect(await sutServingFiles.text()).toBe("console.log(1);");
});

test("a GET of an unknown path returns index.html", async () => {
	await sutServingFiles.getPath("/sorzs/list");

	expect(sutServingFiles.status()).toBe(200);
	expect(await sutServingFiles.text()).toBe("<html>index</html>");
});

test("with STATIC_DIR a GET to an operation URL still answers 404", async () => {
	await sutServingFiles.getPath("/health.check");

	expect(sutServingFiles.status()).toBe(404);
});

test("with STATIC_DIR a POST to an operation reaches the operation", async () => {
	await sutServingFiles.callHealthCheck("e-9");

	expect(sutServingFiles.status()).toBe(200);
});

test("a path that climbs out of the folder does not read outside it", async () => {
	await sutServingFiles.getPath("/..%2fsecret.txt");

	expect(sutServingFiles.status()).toBe(404);
	expect(await sutServingFiles.text()).not.toContain("outside");
});

class SUT {
	private readonly dataDir = mkdtempSync(join(tmpdir(), "sorzs-"));
	private readonly server: Server;
	private response = new Response();
	private token = "";

	constructor(
		variables = serverEnvironment(),
		private readonly scratchFolders: string[] = [],
	) {
		this.server = Server.start(
			0,
			this.dataDir,
			AuthSettings.fromEnv(variables),
			SearchSettings.fromEnv(variables),
			StaticSettings.fromEnv(variables),
			new HttpPageReader(),
		);
	}

	static servingFiles(): SUT {
		const root = mkdtempSync(join(tmpdir(), "sorzs-site-"));
		const folder = join(root, "site");
		mkdirSync(folder);
		writeFileSync(join(folder, "index.html"), "<html>index</html>");
		writeFileSync(join(folder, "app.js"), "console.log(1);");
		writeFileSync(join(root, "secret.txt"), "outside");
		const variables = { ...serverEnvironment(), STATIC_DIR: folder };
		return new SUT(variables, [root]);
	}

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

	async listSorzsWithoutToken(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		this.response = await fetch(`${this.server.url}sorzs.list`, {
			method: "POST",
			body: payload,
		});
	}

	async callHealthCheck(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("health.check", payload);
	}

	async addSorz(callId: string, address: string, name: string): Promise<void> {
		const payload = JSON.stringify({
			header: { callId },
			body: { address, name },
		});
		await this.post("sorzs.add", payload);
	}

	async listSorzs(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("sorzs.list", payload);
	}

	async readCensus(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		await this.post("sorzs.census", payload);
	}

	async censusWithoutToken(callId: string): Promise<void> {
		const payload = JSON.stringify({ header: { callId } });
		this.response = await fetch(`${this.server.url}sorzs.census`, {
			method: "POST",
			body: payload,
		});
	}

	async callUnknownUrl(): Promise<void> {
		await this.post("nothing.here", "{}");
	}

	async getPath(path: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${path.slice(1)}`);
	}

	async getOperationUrl(): Promise<void> {
		this.response = await fetch(`${this.server.url}health.check`);
	}

	status(): number {
		return this.response.status;
	}

	contentType(): string {
		return this.response.headers.get("content-type") ?? "";
	}

	async text(): Promise<string> {
		return await this.response.text();
	}

	async reply(): Promise<unknown> {
		const reply = await this.response.json();
		return reply;
	}

	stop(): void {
		this.server.stop();
		rmSync(this.dataDir, { recursive: true, force: true });
		for (const folder of this.scratchFolders) {
			rmSync(folder, { recursive: true, force: true });
		}
	}

	private async post(path: string, payload: string): Promise<void> {
		this.response = await fetch(`${this.server.url}${path}`, {
			method: "POST",
			headers: { authorization: `Bearer ${this.token}` },
			body: payload,
		});
	}
}
