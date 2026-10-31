import { beforeEach, expect, test } from "bun:test";
import { InMemorySourceListRepository } from "../../../src/infrastructure/InMemorySourceListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { AddSource } from "../../../src/operations/sources/AddSource.ts";
import { ListSources } from "../../../src/operations/sources/ListSources.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sources.list", () => {
	expect(sut.operationName()).toBe("sources.list");
});

test("lists nothing when no source was added", async () => {
	await sut.list();

	expect(sut.status()).toBe(200);
	expect(await sut.body()).toEqual({ sources: [] });
});

test("lists the entries in order of addition", async () => {
	await sut.addSource("https://b.com", "Beta");
	await sut.addSource("https://a.com", "Alpha");

	await sut.list();

	const body = await sut.body();
	expect(body).toEqual({
		sources: [
			{ sourceId: expect.any(String), name: "Beta", address: "https://b.com" },
			{ sourceId: expect.any(String), name: "Alpha", address: "https://a.com" },
		],
	});
});

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private readonly operation = new JsonOperation(
		new ListSources(this.repository),
	);
	private readonly adding = new JsonOperation(new AddSource(this.repository));
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	async addSource(address: string, name: string): Promise<void> {
		const payload = JSON.stringify({
			header: { callId: "a-1" },
			body: { address, name },
		});
		const request = new Request("http://x/sources.add", {
			method: "POST",
			body: payload,
		});
		await this.adding.serve(request);
	}

	async list(): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "l-1" } });
		const request = new Request("http://x/sources.list", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	status(): number {
		return this.response.status;
	}

	async body(): Promise<unknown> {
		const reply = (await this.response.json()) as { body: unknown };
		return reply.body;
	}
}
