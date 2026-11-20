import { beforeEach, expect, test } from "bun:test";
import { DomainQualificationStrategy } from "../../../src/domain/search/DomainQualificationStrategy.ts";
import { SearchFailedError } from "../../../src/domain/search/SearchFailedError.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { AppropediaSearchProvider } from "../../../src/infrastructure/appropedia/AppropediaSearchProvider.ts";
import { entryAt } from "../../domain/sorz-list/EntryAt.ts";

const WIKI = "https://www.appropedia.org";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is the Appropedia provider", () => {
	expect(sut.providerId()).toBe("appropedia");
	expect(sut.providerName()).toBe("Appropedia");
});

test("can search the wiki, with or without www", () => {
	expect(sut.canSearch("https://www.appropedia.org")).toBe(true);
	expect(sut.canSearch("https://appropedia.org")).toBe(true);
});

test("cannot search another domain", () => {
	expect(sut.canSearch("https://example.com")).toBe(false);
});

test("asks the API of the wiki for ten results", async () => {
	await sut.search(WIKI, "solar cooker");

	expect(sut.requestedUrls()).toEqual([
		"https://www.appropedia.org/w/api.php?action=query&list=search&srsearch=solar%20cooker&srlimit=10&format=json",
	]);
});

test("asks the same host for an entry without www", async () => {
	await sut.search("https://appropedia.org", "solar");

	expect(sut.requestedUrls()).toEqual([
		"https://www.appropedia.org/w/api.php?action=query&list=search&srsearch=solar&srlimit=10&format=json",
	]);
});

test("identifies itself with the contact", async () => {
	await sut.search(WIKI, "solar");

	expect(sut.requestedUserAgents()).toEqual(["Sorzs (contact@example.org)"]);
});

test("gives one result per hit with its title and link", async () => {
	sut.finds("Solar cooker", "Rocket stove");

	const results = await sut.search(WIKI, "solar");

	expect(results).toMatchObject([
		{ title: "Solar cooker", url: `${WIKI}/Solar_cooker` },
		{ title: "Rocket stove", url: `${WIKI}/Rocket_stove` },
	]);
});

test("the link keeps slash, colon, underscore and parentheses and encodes the rest", async () => {
	sut.finds("Community action/Join", "Category:Cooking (ñandú)");

	const results = await sut.search(WIKI, "solar");

	expect(results.map((result) => result.url)).toEqual([
		`${WIKI}/Community_action/Join`,
		`${WIKI}/Category:Cooking_(%C3%B1and%C3%BA)`,
	]);
});

test("the description is the snippet as plain text", async () => {
	sut.finds("Solar cooker");
	sut.snippetIs(
		'a <span class="searchmatch">solar</span> oven for &quot;food&quot;',
	);

	const [result] = await sut.search(WIKI, "solar");

	expect(result?.description).toBe('a solar oven for "food"');
});

test("an empty snippet gives an empty description", async () => {
	sut.finds("Solar cooker");
	sut.snippetIs("");

	const [result] = await sut.search(WIKI, "solar");

	expect(result?.description).toBe("");
});

test("gives no results when the wiki finds no hits", async () => {
	sut.finds();

	const results = await sut.search(WIKI, "zzzzqx");

	expect(results).toEqual([]);
});

test("the results come from the sorz by its display name", async () => {
	sut.finds("Solar cooker");

	const [result] = await sut.searchNamed(WIKI, "Appropedia", "solar");

	expect(result?.sorz).toBe("Appropedia");
});

test("cuts the call when the wiki takes too long", async () => {
	await sut.search(WIKI, "solar");

	expect(sut.requestedWithTimeout()).toBe(true);
});

test("fails when the network does not answer", async () => {
	sut.answersWith(() => Promise.reject(new Error("network down")));

	await expect(sut.search(WIKI, "solar")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the wiki answers with a non-success status", async () => {
	sut.answersWith(async () => new Response("busy", { status: 503 }));

	await expect(sut.search(WIKI, "solar")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the body cannot be read", async () => {
	sut.answersWith(async () => new Response("<html>not json</html>"));

	await expect(sut.search(WIKI, "solar")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

test("fails when the body has no hits list", async () => {
	sut.answersWith(async () => Response.json({ unexpected: true }));

	await expect(sut.search(WIKI, "solar")).rejects.toBeInstanceOf(
		SearchFailedError,
	);
});

type Result = { title: string; url: string; description: string; sorz: string };

class SUT {
	private readonly provider = new AppropediaSearchProvider(
		new DomainQualificationStrategy("appropedia.org"),
		(url, init) => this.answer(url, init),
		"contact@example.org",
	);
	private titles: string[] = [];
	private snippet = "";
	private reply: (() => Promise<Response>) | null = null;
	private readonly requests: { url: string; init: RequestInit }[] = [];

	answersWith(reply: () => Promise<Response>): void {
		this.reply = reply;
	}

	finds(...titles: string[]): void {
		this.titles = titles;
	}

	snippetIs(snippet: string): void {
		this.snippet = snippet;
	}

	providerId() {
		return this.provider.id().toJSON();
	}

	providerName(): string {
		return this.provider.name();
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
			snippet: this.snippet,
		}));
		return Response.json({ query: { search } });
	}
}
