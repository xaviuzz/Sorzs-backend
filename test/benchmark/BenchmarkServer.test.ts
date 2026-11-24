import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BenchmarkServer } from "../../benchmark/BenchmarkServer.ts";
import { serverEnvironment } from "../ServerEnvironment.ts";

const LATENCY = 150;
const REAL_NETWORK_TIMEOUT = 3000;

let sut: SUT;

beforeEach(async () => {
	sut = new SUT();
});

afterEach(() => {
	sut.stop();
});

test("adding a sorz at a synthetic address answers after the latency, never after the network timeout", async () => {
	await sut.start(LATENCY);

	const elapsed = await sut.timeAdding("https://bench-1.example");

	expect(elapsed).toBeGreaterThanOrEqual(LATENCY);
	expect(elapsed).toBeLessThan(REAL_NETWORK_TIMEOUT);
	expect(sut.status()).toBe(200);
});

test("searching a wiki sorz answers results after the latency", async () => {
	await sut.start(LATENCY);
	await sut.timeAdding("https://www.appropedia.org");

	const elapsed = await sut.timeSearching("solar");

	expect(elapsed).toBeGreaterThanOrEqual(LATENCY);
	expect(await sut.titles()).not.toEqual([]);
});

test("searching a wikipedia sorz answers results", async () => {
	await sut.start(0);
	await sut.timeAdding("https://es.wikipedia.org");

	await sut.timeSearching("ciberpunk");

	expect(await sut.titles()).not.toEqual([]);
});

test("searching a geek feminism sorz answers results", async () => {
	await sut.start(0);
	await sut.timeAdding("https://geekfeminism.fandom.com");

	await sut.timeSearching("adacamp");

	expect(await sut.titles()).not.toEqual([]);
});

test("with no latency every call answers at once", async () => {
	await sut.start(0);

	const elapsed = await sut.timeAdding("https://bench-2.example");

	expect(elapsed).toBeLessThan(LATENCY);
});

class SUT {
	private server: BenchmarkServer | null = null;
	private token = "";
	private response = new Response();

	async start(latencyMs: number): Promise<void> {
		const dataDir = mkdtempSync(join(tmpdir(), "sorzs-benchmark-"));
		this.server = BenchmarkServer.start(
			0,
			dataDir,
			serverEnvironment(),
			latencyMs,
		);
		await this.logIn();
	}

	stop(): void {
		this.server?.stop();
	}

	status(): number {
		return this.response.status;
	}

	async timeAdding(address: string): Promise<number> {
		return this.time("sorzs.add", { address, name: "" });
	}

	async timeSearching(query: string): Promise<number> {
		return this.time("sorzs.search", { query });
	}

	async titles(): Promise<string[]> {
		const reply = (await this.response.json()) as {
			body: { results: { title: string }[] };
		};
		return reply.body.results.map((result) => result.title);
	}

	private async logIn(): Promise<void> {
		await this.post("auth.login", { username: "xaviuzz", password: "p1casso" });
		const reply = (await this.response.json()) as { body: { token: string } };
		this.token = reply.body.token;
	}

	private async time(path: string, body: object): Promise<number> {
		const started = performance.now();
		await this.post(path, body);
		return performance.now() - started;
	}

	private async post(path: string, body: object): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "bench" }, body });
		this.response = await fetch(`${this.server?.url}${path}`, {
			method: "POST",
			headers: { authorization: `Bearer ${this.token}` },
			body: payload,
		});
	}
}
