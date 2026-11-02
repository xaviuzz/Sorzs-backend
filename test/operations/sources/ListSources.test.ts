import { beforeEach, expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { AddSource } from "../../../src/operations/sources/AddSource.ts";
import { ListSources } from "../../../src/operations/sources/ListSources.ts";
import { FakePageReader } from "./FakePageReader.ts";

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
			{
				sourceId: expect.any(String),
				name: "Beta",
				address: "https://b.com",
				title: null,
				favicon: null,
			},
			{
				sourceId: expect.any(String),
				name: "Alpha",
				address: "https://a.com",
				title: null,
				favicon: null,
			},
		],
	});
});

test("lists the title and favicon learned when each source was added", async () => {
	sut.pageOffers("https://a.com", "Alpha Site", "https://a.com/i.png");
	await sut.addSource("https://a.com", "Alpha");
	await sut.addSource("https://b.com", "");

	await sut.list();

	const body = await sut.body();
	expect(body).toMatchObject({
		sources: [
			{ title: "Alpha Site", favicon: "https://a.com/i.png" },
			{ name: null, title: null, favicon: null },
		],
	});
});

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private readonly reader = new FakePageReader();
	private readonly operation = new JsonOperation(
		new ListSources(this.repository),
	);
	private readonly adding = new JsonOperation(
		new AddSource(this.repository, this.reader),
	);
	private response = new Response();

	pageOffers(address: string, title: string, favicon: string): void {
		const info = new PageInfo(
			PageTitle.from(title),
			FaviconAddress.from(favicon),
		);
		this.reader.offers(address, info);
	}

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
