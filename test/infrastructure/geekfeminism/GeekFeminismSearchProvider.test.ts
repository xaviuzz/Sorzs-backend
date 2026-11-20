import { beforeEach, expect, test } from "bun:test";
import { DomainQualificationStrategy } from "../../../src/domain/search/DomainQualificationStrategy.ts";
import { SearchFailedError } from "../../../src/domain/search/SearchFailedError.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { GeekFeminismSearchProvider } from "../../../src/infrastructure/geekfeminism/GeekFeminismSearchProvider.ts";
import { entryAt } from "../../domain/sorz-list/EntryAt.ts";

const WIKI = "https://geekfeminism.fandom.com";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is the Geek Feminism provider", () => {
	expect(sut.providerId()).toBe("geekfeminism");
});

test("can search what its qualification accepts", () => {
	expect(sut.canSearch(WIKI)).toBe(true);
});

test("cannot search what its qualification refuses", () => {
	expect(sut.canSearch("https://starwars.fandom.com")).toBe(false);
});

test("asks the API of the sorz's host for ten results", async () => {
	await sut.search(`${WIKI}/wiki/AdaCamp`, "adacamp");

	expect(sut.requestedUrls()).toEqual([
		"https://geekfeminism.fandom.com/api.php?action=query&list=search&srsearch=adacamp&srlimit=10&format=json",
	]);
});

test("encodes the query", async () => {
	await sut.search(WIKI, "café & té");

	expect(sut.requestedUrls()).toEqual([
		"https://geekfeminism.fandom.com/api.php?action=query&list=search&srsearch=caf%C3%A9%20%26%20t%C3%A9&srlimit=10&format=json",
	]);
});

test("identifies itself with the contact", async () => {
	await sut.search(WIKI, "adacamp");

	expect(sut.requestedUserAgents()).toEqual(["Sorzs (contact@example.org)"]);
});

test("gives one result per hit with its title and link", async () => {
	sut.finds("AdaCamp", "Ada Lovelace Day");

	const results = await sut.search(WIKI, "ada");

	expect(results).toEqual([
		{
			title: "AdaCamp",
			url: "https://geekfeminism.fandom.com/wiki/AdaCamp",
			description: "",
			sorz: WIKI,
		},
		{
			title: "Ada Lovelace Day",
			url: "https://geekfeminism.fandom.com/wiki/Ada_Lovelace_Day",
			description: "",
			sorz: WIKI,
		},
	]);
});

test("the link keeps slash, colon, underscore and parentheses and encodes the rest", async () => {
	sut.finds("AdaCamp/AdaCampDCSessions", "Category:Women (écrivaines)");

	const results = await sut.search(WIKI, "ada");

	expect(results.map((result) => result.url)).toEqual([
		"https://geekfeminism.fandom.com/wiki/AdaCamp/AdaCampDCSessions",
		"https://geekfeminism.fandom.com/wiki/Category:Women_(%C3%A9crivaines)",
	]);
});

test("gives no results when the wiki finds no hits", async () => {
	sut.finds();

	const results = await sut.search(WIKI, "zzzzqx");

	expect(results).toEqual([]);
});

test("the results come from the sorz by its display name", async () => {
	sut.finds("AdaCamp");

	const [result] = await sut.searchNamed(WIKI, "Geek Feminism", "ada");

	expect(result?.sorz).toBe("Geek Feminism");
});

test("cuts the call when the wiki takes too long", async () => {
	await sut.search(WIKI, "adacamp");

	expect(sut.requestedWithTimeout()).toBe(true);
});

test("fails when the network does not answer", async () => {
	sut.answersWith(() => Promise.reject(new Error("network down")));

	await expect(sut.search(WIKI, "adacamp")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the wiki answers with a non-success status", async () => {
	sut.answersWith(async () => new Response("busy", { status: 503 }));

	await expect(sut.search(WIKI, "adacamp")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the wiki asks to slow down", async () => {
	sut.answersWith(async () => new Response("slow", { status: 429 }));

	await expect(sut.search(WIKI, "adacamp")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the body cannot be read", async () => {
	sut.answersWith(async () => new Response("<html>not json</html>"));

	await expect(sut.search(WIKI, "adacamp")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the body has no hits list", async () => {
	sut.answersWith(async () => Response.json({ unexpected: true }));

	await expect(sut.search(WIKI, "adacamp")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

type Result = { title: string; url: string; description: string; sorz: string };

class SUT {
	private readonly provider = new GeekFeminismSearchProvider(
		new DomainQualificationStrategy("geekfeminism.fandom.com"),
		(url, init) => this.answer(url, init),
		"contact@example.org",
	);
	private titles: string[] = [];
	private reply: (() => Promise<Response>) | null = null;
	private readonly requests: { url: string; init: RequestInit }[] = [];

	answersWith(reply: () => Promise<Response>): void {
		this.reply = reply;
	}

	finds(...titles: string[]): void {
		this.titles = titles;
	}

	providerId() {
		return this.provider.id().toJSON();
	}

	canSearch(address: string): boolean {
		return this.provider.canSearch(entryAt(address));
	}

	async search(address: string, query: string): Promise<Result[]> {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(
		address: string,
		name: string,
		query: string,
	): Promise<Result[]> {
		const entry = entryAt(address, name);
		const results = await this.provider.search(entry, SearchQuery.from(query));
		return results.toJSON() as Result[];
	}

	requestedUrls(): string[] {
		return this.requests.map((request) => request.url);
	}

	requestedUserAgents(): string[] {
		return this.requests.map((request) => {
			const headers = new Headers(request.init.headers);
			return headers.get("User-Agent") ?? "";
		});
	}

	requestedWithTimeout(): boolean {
		const signals = this.requests.map((request) => request.init.signal);
		return signals.every((signal) => signal instanceof AbortSignal);
	}

	private async answer(url: string, init: RequestInit): Promise<Response> {
		this.requests.push({ url, init });
		if (this.reply) return this.reply();
		const search = this.titles.map((title) => ({
			title,
			pageid: 1,
			snippet: "",
		}));
		return Response.json({ query: { search } });
	}
}
