import { beforeEach, expect, test } from "bun:test";
import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { OwnedBy } from "../../../src/operations/OwnedBy.ts";
import { AddSorz } from "../../../src/operations/sorzs/AddSorz.ts";
import { SearchProvidersFactory } from "../../../src/operations/sorzs/SearchProvidersFactory.ts";
import { SearchSorzs } from "../../../src/operations/sorzs/SearchSorzs.ts";
import { FakePageReader } from "./FakePageReader.ts";
import { xaviuzz } from "./Owners.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("a sorz on reddit is searched on Reddit and any other on Google", async () => {
	await sut.addSorz("https://www.reddit.com/r/spain");
	await sut.addSorz("https://example.com");

	const titles = await sut.titlesOfSearch("rust");

	expect(titles).toEqual(["Search it on Reddit", "Search it on Google"]);
});

test("a wikipedia sorz is searched on Wikipedia and never on Google", async () => {
	await sut.addSorz("https://es.wikipedia.org");

	const titles = await sut.titlesOfSearch("ciberpunk");

	expect(titles).toEqual(["Ciberpunk", "Neuromante"]);
});

test("the results keep the order of the list", async () => {
	await sut.addSorz("https://www.reddit.com/r/spain");
	await sut.addSorz("https://es.wikipedia.org");
	await sut.addSorz("https://example.com");

	const titles = await sut.titlesOfSearch("ciberpunk");

	expect(titles).toEqual([
		"Search it on Reddit",
		"Ciberpunk",
		"Neuromante",
		"Search it on Google",
	]);
});

test("the Wikipedia call identifies Sorzs with the contact it was given", async () => {
	await sut.addSorz("https://es.wikipedia.org");

	await sut.titlesOfSearch("ciberpunk");

	expect(sut.userAgentsSeen()).toEqual(["Sorzs (contact@example.org)"]);
});

test("a sorz that Wikipedia does not answer is reported and the others still answer", async () => {
	await sut.addSorz("https://es.wikipedia.org");
	await sut.addSorz("https://example.com");
	sut.wikipediaIsDown();

	const reply = await sut.searchReply("ciberpunk");

	expect(reply.body).toEqual({
		results: [expect.objectContaining({ title: "Search it on Google" })],
		failed: ["https://es.wikipedia.org"],
	});
});

type SearchReply = { body: { results: { title: string }[]; failed: string[] } };

class SUT {
	private readonly repository = new InMemorySorzListRepository();
	private readonly userAgents: string[] = [];
	private wikipediaAnswers = true;
	private readonly providers = new SearchProvidersFactory(
		"contact@example.org",
		async (_url, init) => this.wikipedia(init),
	).build();
	private readonly adding = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new AddSorz(this.repository, new FakePageReader(), this.providers),
		),
	);
	private readonly searching = new JsonOperation(
		new OwnedBy(xaviuzz, new SearchSorzs(this.repository, this.providers)),
	);

	wikipediaIsDown(): void {
		this.wikipediaAnswers = false;
	}

	userAgentsSeen(): string[] {
		return [...this.userAgents];
	}

	async addSorz(address: string): Promise<void> {
		await this.post(this.adding, "sorzs.add", { address, name: "" });
	}

	async titlesOfSearch(query: string): Promise<string[]> {
		const reply = await this.searchReply(query);
		const titles: string[] = [];
		for (const result of reply.body.results) titles.push(result.title);
		return titles;
	}

	async searchReply(query: string): Promise<SearchReply> {
		const response = await this.post(this.searching, "sorzs.search", {
			query,
		});
		return (await response.json()) as SearchReply;
	}

	private async wikipedia(init: RequestInit): Promise<Response> {
		this.userAgents.push(new Headers(init.headers).get("User-Agent") ?? "");
		let answer = Response.json({
			pages: [
				{ title: "Ciberpunk", key: "Ciberpunk", description: "Subgénero" },
				{ title: "Neuromante", key: "Neuromante", description: "Novela" },
			],
		});
		if (!this.wikipediaAnswers) answer = new Response("", { status: 503 });
		return answer;
	}

	private post(
		operation: JsonOperation,
		name: string,
		body: unknown,
	): Promise<Response> {
		const payload = JSON.stringify({ header: { callId: "c-1" }, body });
		const request = new Request(`http://x/${name}`, {
			method: "POST",
			body: payload,
		});
		return operation.serve(request);
	}
}
