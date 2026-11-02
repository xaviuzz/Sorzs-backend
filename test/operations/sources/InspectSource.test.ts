import { beforeEach, expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/source/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";
import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { InspectSource } from "../../../src/operations/sources/InspectSource.ts";
import { ListSources } from "../../../src/operations/sources/ListSources.ts";
import { FakePageReader } from "./FakePageReader.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sources.inspect", () => {
	expect(sut.operationName()).toBe("sources.inspect");
});

test("answers the title and favicon the page offers", async () => {
	sut.pageOffers("https://example.com", "Example", "https://example.com/i.png");

	await sut.inspect({ address: "https://example.com" });

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toEqual({ callId: "i-1", status: "ok" });
	expect(reply.body).toMatchObject({
		title: "Example",
		favicon: "https://example.com/i.png",
	});
});

test("answers null for each part the page does not offer", async () => {
	await sut.inspect({ address: "https://example.com" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({ title: null, favicon: null, candidates: [] });
});

test("offers the pasted address as a candidate when it has a title", async () => {
	sut.pageOffers("https://example.com", "Example", "https://example.com/i.png");

	await sut.inspect({ address: "https://example.com" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		candidates: [
			{
				address: "https://example.com",
				title: "Example",
				favicon: "https://example.com/i.png",
			},
		],
	});
});

test("reads every candidate address of a deep address", async () => {
	await sut.inspect({ address: "https://talk.com/a/b" });

	expect(sut.addressesRead().sort()).toEqual([
		"https://talk.com",
		"https://talk.com/a",
		"https://talk.com/a/b",
	]);
});

test("offers only the candidates with a title, from the root to the pasted address", async () => {
	sut.pageOffers("https://talk.com", "Talk", "https://talk.com/i.png");
	sut.pageOffers("https://talk.com/a/b", "Deep", "https://talk.com/b.png");

	await sut.inspect({ address: "https://talk.com/a/b" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		title: "Deep",
		favicon: "https://talk.com/b.png",
		candidates: [
			{ address: "https://talk.com", title: "Talk" },
			{ address: "https://talk.com/a/b", title: "Deep" },
		],
	});
});

test("keeps title and favicon of the pasted address when it has none", async () => {
	sut.pageOffers("https://talk.com", "Talk", "https://talk.com/i.png");

	await sut.inspect({ address: "https://talk.com/a" });

	const reply = await sut.reply();
	expect(reply.body).toEqual({
		title: null,
		favicon: null,
		candidates: [
			{
				address: "https://talk.com",
				title: "Talk",
				favicon: "https://talk.com/i.png",
			},
		],
	});
});

test("trims the address before reading", async () => {
	await sut.inspect({ address: "  https://example.com  " });

	expect(sut.addressesRead()).toEqual(["https://example.com"]);
});

test.each([
	["a missing address", {}],
	["an address that is not text", { address: 3 }],
	["an address that is not a web address", { address: "example" }],
	["an ftp address", { address: "ftp://example.com" }],
])("refuses %s with INVALID_BODY", async (_title, body) => {
	await sut.inspect(body);

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "INVALID_BODY" });
	expect(sut.addressesRead()).toEqual([]);
});

test("registers nothing", async () => {
	await sut.inspect({ address: "https://example.com" });

	expect(await sut.sourcesInList()).toEqual([]);
});

type Reply = { header: Record<string, unknown>; body: unknown };

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private readonly reader = new FakePageReader();
	private readonly operation = new JsonOperation(
		new InspectSource(this.reader),
	);
	private readonly listing = new JsonOperation(
		new ListSources(this.repository),
	);
	private response = new Response();

	operationName(): string {
		return this.operation.name;
	}

	pageOffers(address: string, title: string, favicon: string): void {
		const info = new PageInfo(
			PageTitle.from(title),
			FaviconAddress.from(favicon),
		);
		this.reader.offers(address, info);
	}

	async inspect(body: unknown): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "i-1" }, body });
		const request = new Request("http://x/sources.inspect", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	addressesRead(): string[] {
		return this.reader.reads();
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<Reply> {
		const reply = (await this.response.json()) as Reply;
		return reply;
	}

	async sourcesInList(): Promise<unknown[]> {
		const request = new Request("http://x/sources.list", {
			method: "POST",
			body: JSON.stringify({ header: { callId: "l-1" } }),
		});
		const response = await this.listing.serve(request);
		const reply = (await response.json()) as { body: { sources: unknown[] } };
		return reply.body.sources;
	}
}
