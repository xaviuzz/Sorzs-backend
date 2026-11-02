import { beforeEach, expect, test } from "bun:test";
import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { OwnedBy } from "../../../src/operations/OwnedBy.ts";
import { AddSource } from "../../../src/operations/sources/AddSource.ts";
import { SearchSources } from "../../../src/operations/sources/SearchSources.ts";
import { FakePageReader } from "./FakePageReader.ts";
import { FakeSourceSearch } from "./FakeSourceSearch.ts";
import { ana, xaviuzz } from "./Owners.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sources.search", () => {
	expect(sut.operationName()).toBe("sources.search");
});

test("answers no results when the list is empty", async () => {
	await sut.search({ query: "bun" });

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toEqual({ callId: "s-1", status: "ok" });
	expect(reply.body).toEqual({ results: [] });
});

test("answers one result per source with the name the list shows", async () => {
	await sut.addSource("https://a.com", "Alpha");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({
		results: [
			{
				title: "title",
				url: "link:a.com",
				description: "bun",
				source: "Alpha",
			},
		],
	});
});

test("answers in list order even when an earlier source answers last", async () => {
	await sut.addSource("https://a.com", "Alpha");
	await sut.addSource("https://b.com", "Beta");
	await sut.addSource("https://c.com", "Gamma");
	sut.isSlowFor("a.com");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		results: [{ source: "Alpha" }, { source: "Beta" }, { source: "Gamma" }],
	});
});

test("searches every source before any of them answers", async () => {
	await sut.addSource("https://a.com", "Alpha");
	await sut.addSource("https://b.com", "Beta");
	sut.answersOnlyWhenTogether(2);

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		results: [{ source: "Alpha" }, { source: "Beta" }],
	});
});

test("searches with the trimmed query", async () => {
	await sut.addSource("https://a.com", "Alpha");

	await sut.search({ query: "  bun  " });

	expect(sut.queriesSearched()).toEqual(["bun"]);
});

test.each([
	["a missing query", {}],
	["a query that is not text", { query: 3 }],
	["a blank query", { query: "   " }],
	["a query over 200 characters", { query: "a".repeat(201) }],
])("refuses %s with INVALID_BODY", async (_title, body) => {
	await sut.addSource("https://a.com", "Alpha");

	await sut.search(body);

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "INVALID_BODY" });
	expect(sut.queriesSearched()).toEqual([]);
});

test("searches only the sources of the user who asks", async () => {
	await sut.addSourceAsAna("https://ana.com", "Ana's");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({ results: [] });
});

type Reply = { header: Record<string, unknown>; body: unknown };

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private readonly reader = new FakePageReader();
	private readonly searching = new FakeSourceSearch();
	private readonly operation = new JsonOperation(
		new OwnedBy(xaviuzz, new SearchSources(this.repository, this.searching)),
	);
	private readonly adding = new JsonOperation(
		new OwnedBy(xaviuzz, new AddSource(this.repository, this.reader)),
	);
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	isSlowFor(site: string): void {
		this.searching.isSlowFor(site);
	}

	answersOnlyWhenTogether(count: number): void {
		this.searching.answersOnlyWhenTogether(count);
	}

	async addSourceAsAna(address: string, name: string): Promise<void> {
		const payload = JSON.stringify({
			header: { callId: "a-2" },
			body: { address, name },
		});
		const request = new Request("http://x/sources.add", {
			method: "POST",
			body: payload,
		});
		const operation = new JsonOperation(
			new OwnedBy(ana, new AddSource(this.repository, this.reader)),
		);
		await operation.serve(request);
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

	async search(body: unknown): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "s-1" }, body });
		const request = new Request("http://x/sources.search", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	queriesSearched(): string[] {
		return this.searching.searched();
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<Reply> {
		const reply = (await this.response.json()) as Reply;
		return reply;
	}
}
