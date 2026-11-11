import { beforeEach, expect, test } from "bun:test";
import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { OwnedBy } from "../../../src/operations/OwnedBy.ts";
import { AddSorz } from "../../../src/operations/sorzs/AddSorz.ts";
import { ListSorzs } from "../../../src/operations/sorzs/ListSorzs.ts";
import { SearchProvidersFactory } from "../../../src/operations/sorzs/SearchProvidersFactory.ts";
import { FakePageReader } from "./FakePageReader.ts";
import { ana, xaviuzz } from "./Owners.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sorzs.list", () => {
	expect(sut.operationName()).toBe("sorzs.list");
});

test("lists nothing when no sorz was added", async () => {
	await sut.list();

	expect(sut.status()).toBe(200);
	expect(await sut.body()).toEqual({ sorzs: [] });
});

test("lists the entries in order of addition", async () => {
	await sut.addSorz("https://b.com", "Beta");
	await sut.addSorz("https://a.com", "Alpha");

	await sut.list();

	const body = await sut.body();
	expect(body).toEqual({
		sorzs: [
			{
				sorzId: expect.any(String),
				name: "Beta",
				address: "https://b.com",
				title: null,
				favicon: null,
				provider: "generic",
			},
			{
				sorzId: expect.any(String),
				name: "Alpha",
				address: "https://a.com",
				title: null,
				favicon: null,
				provider: "generic",
			},
		],
	});
});

test("lists the title and favicon learned when each sorz was added", async () => {
	sut.pageOffers("https://a.com", "Alpha Site", "https://a.com/i.png");
	await sut.addSorz("https://a.com", "Alpha");
	await sut.addSorz("https://b.com", "");

	await sut.list();

	const body = await sut.body();
	expect(body).toMatchObject({
		sorzs: [
			{ title: "Alpha Site", favicon: "https://a.com/i.png" },
			{ name: null, title: null, favicon: null },
		],
	});
});

test("lists the provider of each entry", async () => {
	await sut.addSorz("https://www.reddit.com/r/spain", "");
	await sut.addSorz("https://example.com", "");

	await sut.list();

	const body = await sut.body();
	expect(body).toMatchObject({
		sorzs: [{ provider: "reddit" }, { provider: "generic" }],
	});
});

test("lists only the entries of the user who asks", async () => {
	await sut.addSorzAsAna("https://ana.com", "Ana's");

	await sut.list();

	expect(await sut.body()).toEqual({ sorzs: [] });
});

class SUT {
	private readonly repository = new InMemorySorzListRepository();
	private readonly reader = new FakePageReader();
	private readonly operation = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new ListSorzs(this.repository, new SearchProvidersFactory().build()),
		),
	);
	private readonly adding = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new AddSorz(
				this.repository,
				this.reader,
				new SearchProvidersFactory().build(),
			),
		),
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
					new SearchProvidersFactory().build(),
				),
			),
		);
		this.response = await operation.serve(request);
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

	async list(): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "l-1" } });
		const request = new Request("http://x/sorzs.list", {
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
