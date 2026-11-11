import { beforeEach, expect, test } from "bun:test";
import { SearchProviders } from "../../../src/domain/search/SearchProviders.ts";
import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { OwnedBy } from "../../../src/operations/OwnedBy.ts";
import { AddSorz } from "../../../src/operations/sorzs/AddSorz.ts";
import { SearchSorzs } from "../../../src/operations/sorzs/SearchSorzs.ts";
import { FakePageReader } from "./FakePageReader.ts";
import { FakeSearchProvider } from "./FakeSearchProvider.ts";
import { ana, xaviuzz } from "./Owners.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sorzs.search", () => {
	expect(sut.operationName()).toBe("sorzs.search");
});

test("answers no results when the list is empty", async () => {
	await sut.search({ query: "bun" });

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toEqual({ callId: "s-1", status: "ok" });
	expect(reply.body).toEqual({ results: [] });
});

test("answers one result per sorz with the name the list shows", async () => {
	await sut.addSorz("https://a.com", "Alpha");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({
		results: [
			{
				title: "title",
				url: "link:a.com",
				description: "bun",
				sorz: "Alpha",
			},
		],
	});
});

test("answers in list order even when an earlier sorz answers last", async () => {
	await sut.addSorz("https://a.com", "Alpha");
	await sut.addSorz("https://b.com", "Beta");
	await sut.addSorz("https://c.com", "Gamma");
	sut.isSlowFor("a.com");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		results: [{ sorz: "Alpha" }, { sorz: "Beta" }, { sorz: "Gamma" }],
	});
});

test("searches every sorz before any of them answers", async () => {
	await sut.addSorz("https://a.com", "Alpha");
	await sut.addSorz("https://b.com", "Beta");
	sut.answersOnlyWhenTogether(2);

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		results: [{ sorz: "Alpha" }, { sorz: "Beta" }],
	});
});

test("searches with the trimmed query", async () => {
	await sut.addSorz("https://a.com", "Alpha");

	await sut.search({ query: "  bun  " });

	expect(sut.queriesSearched()).toEqual(["bun"]);
});

test.each([
	["a missing query", {}],
	["a query that is not text", { query: 3 }],
	["a blank query", { query: "   " }],
	["a query over 200 characters", { query: "a".repeat(201) }],
])("refuses %s with INVALID_BODY", async (_title, body) => {
	await sut.addSorz("https://a.com", "Alpha");

	await sut.search(body);

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "INVALID_BODY" });
	expect(sut.queriesSearched()).toEqual([]);
});

test("searches only the sorzs of the user who asks", async () => {
	await sut.addSorzAsAna("https://ana.com", "Ana's");

	await sut.search({ query: "bun" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({ results: [] });
});

type Reply = { header: Record<string, unknown>; body: unknown };

class SUT {
	private readonly repository = new InMemorySorzListRepository();
	private readonly reader = new FakePageReader();
	private readonly searching = new FakeSearchProvider();
	private readonly operation = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new SearchSorzs(this.repository, new SearchProviders([], this.searching)),
		),
	);
	private readonly adding = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new AddSorz(
				this.repository,
				this.reader,
				new SearchProviders([], this.searching),
			),
		),
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

	async addSorzAsAna(address: string, name: string): Promise<void> {
		const payload = JSON.stringify({
			header: { callId: "a-2" },
			body: { address, name },
		});
		const request = new Request("http://x/sorzs.add", {
			method: "POST",
			body: payload,
		});
		const operation = new JsonOperation(
			new OwnedBy(
				ana,
				new AddSorz(
					this.repository,
					this.reader,
					new SearchProviders([], this.searching),
				),
			),
		);
		await operation.serve(request);
	}

	async addSorz(address: string, name: string): Promise<void> {
		const payload = JSON.stringify({
			header: { callId: "a-1" },
			body: { address, name },
		});
		const request = new Request("http://x/sorzs.add", {
			method: "POST",
			body: payload,
		});
		await this.adding.serve(request);
	}

	async search(body: unknown): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "s-1" }, body });
		const request = new Request("http://x/sorzs.search", {
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
