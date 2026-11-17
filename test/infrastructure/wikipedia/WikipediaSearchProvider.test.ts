import { beforeEach, expect, test } from "bun:test";
import { SearchFailedError } from "../../../src/domain/search/SearchFailedError.ts";
import { SearchQuery } from "../../../src/domain/search/SearchQuery.ts";
import { WikipediaQualificationStrategy } from "../../../src/domain/search/WikipediaQualificationStrategy.ts";
import { WikipediaSearchProvider } from "../../../src/infrastructure/wikipedia/WikipediaSearchProvider.ts";
import { entryAt } from "../../domain/sorz-list/EntryAt.ts";
import { FakeClock } from "./FakeClock.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is the Wikipedia provider", () => {
	expect(sut.providerId()).toBe("wikipedia");
});

test("can search what its qualification accepts", () => {
	expect(sut.canSearch("https://es.wikipedia.org")).toBe(true);
});

test("cannot search what its qualification refuses", () => {
	expect(sut.canSearch("https://example.com")).toBe(false);
});

test("asks the REST search of the sorz's language for ten pages", async () => {
	await sut.search("https://es.wikipedia.org/wiki/Ciberpunk", "ciberpunk");

	expect(sut.requestedUrls()).toEqual([
		"https://es.wikipedia.org/w/rest.php/v1/search/page?q=ciberpunk&limit=10",
	]);
});

test("asks the Wikipedia of another language when the sorz is on it", async () => {
	await sut.search("https://en.m.wikipedia.org", "cyberpunk");

	expect(sut.requestedUrls()).toEqual([
		"https://en.wikipedia.org/w/rest.php/v1/search/page?q=cyberpunk&limit=10",
	]);
});

test("encodes the query", async () => {
	await sut.search("https://es.wikipedia.org", "café & té");

	expect(sut.requestedUrls()).toEqual([
		"https://es.wikipedia.org/w/rest.php/v1/search/page?q=caf%C3%A9%20%26%20t%C3%A9&limit=10",
	]);
});

test("identifies itself with the contact", async () => {
	await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedUserAgents()).toEqual(["Sorzs (contact@example.org)"]);
});

test("cuts the call when Wikipedia takes too long", async () => {
	await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedWithTimeout()).toBe(true);
});

test("gives one result per page with its title and description", async () => {
	sut.finds(
		page("Ciberpunk", "Ciberpunk", "Subgénero de ciencia ficción"),
		page("Neuromante", "Neuromante", "Novela de William Gibson"),
	);

	const results = await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(results).toEqual([
		{
			title: "Ciberpunk",
			url: "https://es.wikipedia.org/wiki/Ciberpunk",
			description: "Subgénero de ciencia ficción",
			sorz: "https://es.wikipedia.org",
		},
		{
			title: "Neuromante",
			url: "https://es.wikipedia.org/wiki/Neuromante",
			description: "Novela de William Gibson",
			sorz: "https://es.wikipedia.org",
		},
	]);
});

test("the link encodes special characters except underscore and parentheses", async () => {
	sut.finds(page("Ciberpunk (género)", "Ciberpunk_(género)", "Un género"));

	const [result] = await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(result?.url).toBe(
		"https://es.wikipedia.org/wiki/Ciberpunk_(g%C3%A9nero)",
	);
});

test("the link points to the language of the sorz", async () => {
	sut.finds(page("Cyberpunk", "Cyberpunk", "A subgenre"));

	const [result] = await sut.search("https://en.m.wikipedia.org", "cyberpunk");

	expect(result?.url).toBe("https://en.wikipedia.org/wiki/Cyberpunk");
});

test("a missing description falls back to the excerpt as plain text", async () => {
	sut.finds(
		pageWithoutDescription(
			"Conglomerado",
			"Conglomerado",
			'un <span class="searchmatch">conglomerado</span> de empresas &quot;masivo&quot; y it&#039;s',
		),
	);

	const [result] = await sut.search("https://es.wikipedia.org", "conglomerado");

	expect(result?.description).toBe(
		`un conglomerado de empresas "masivo" y it's`,
	);
});

test("an empty description falls back to the excerpt", async () => {
	sut.finds(page("Ciberpunk", "Ciberpunk", "", "el <b>ciberpunk</b>"));

	const [result] = await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(result?.description).toBe("el ciberpunk");
});

test("gives no results when Wikipedia finds no pages", async () => {
	sut.finds();

	const results = await sut.search("https://es.wikipedia.org", "zzzzqx");

	expect(results).toEqual([]);
});

test("the results come from the sorz by its display name", async () => {
	sut.finds(page("Ciberpunk", "Ciberpunk", "Subgénero"));

	const [result] = await sut.searchNamed(
		"https://es.wikipedia.org",
		"Spanish Wikipedia",
		"ciberpunk",
	);

	expect(result?.sorz).toBe("Spanish Wikipedia");
});

test("two sorzs of one Wikipedia are asked separately", async () => {
	await sut.search("https://es.wikipedia.org", "ciberpunk");
	await sut.search("https://es.wikipedia.org/wiki/Ciberpunk", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(2);
});

test("fails when the network does not answer", async () => {
	sut.answersWith(() => Promise.reject(new Error("network down")));

	await expect(
		sut.search("https://es.wikipedia.org", "ciberpunk"),
	).rejects.toBeInstanceOf(SearchFailedError);
});

test("fails when Wikipedia answers with a non-success status", async () => {
	sut.answersWith(async () => new Response("busy", { status: 503 }));

	await expect(
		sut.search("https://es.wikipedia.org", "ciberpunk"),
	).rejects.toBeInstanceOf(SearchFailedError);
});

test("fails when the body cannot be read", async () => {
	sut.answersWith(async () => new Response("<html>not json</html>"));

	await expect(
		sut.search("https://es.wikipedia.org", "ciberpunk"),
	).rejects.toBeInstanceOf(SearchFailedError);
});

test("fails when the body has no pages", async () => {
	sut.answersWith(async () => Response.json({ unexpected: true }));

	await expect(
		sut.search("https://es.wikipedia.org", "ciberpunk"),
	).rejects.toBeInstanceOf(SearchFailedError);
});

test("the sorz fails when Wikipedia asks to slow down", async () => {
	sut.slowsDown("30");

	await expect(
		sut.search("https://es.wikipedia.org", "ciberpunk"),
	).rejects.toBeInstanceOf(SearchFailedError);
});

test("asks nothing of that language until the time Wikipedia names has passed", async () => {
	sut.slowsDown("30");
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	sut.passMilliseconds(29_999);
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(1);
});

test("asks again once the time has passed", async () => {
	sut.slowsDown("30");
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");
	sut.recovers();

	sut.passMilliseconds(30_000);
	await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(2);
});

test("waits a minute when Wikipedia names no time", async () => {
	sut.slowsDown(null);
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	sut.passMilliseconds(59_999);
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");
	sut.recovers();
	sut.passMilliseconds(1);
	await sut.search("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(2);
});

test("waits a minute when the time Wikipedia names is not a number of seconds", async () => {
	sut.slowsDown("soon");
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	sut.passMilliseconds(59_999);
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(1);
});

test("slowing down on one language does not affect another", async () => {
	sut.slowsDown("30");
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");
	sut.recovers();

	await sut.search("https://en.wikipedia.org", "cyberpunk");

	expect(sut.requestedUrls()).toHaveLength(2);
});

test("slowing down holds for every sorz of that language", async () => {
	sut.slowsDown("30");
	await sut.searchFailing("https://es.wikipedia.org", "ciberpunk");

	await sut.searchFailing("https://es.m.wikipedia.org", "ciberpunk");

	expect(sut.requestedUrls()).toHaveLength(1);
});

type Page = {
	title: string;
	key: string;
	description: string | null;
	excerpt: string;
};

function page(
	title: string,
	key: string,
	description: string,
	excerpt = "",
): Page {
	return { title, key, description, excerpt };
}

function pageWithoutDescription(
	title: string,
	key: string,
	excerpt: string,
): Page {
	return { title, key, description: null, excerpt };
}

class SUT {
	private readonly clock = new FakeClock();
	private readonly provider = new WikipediaSearchProvider(
		new WikipediaQualificationStrategy(),
		(url, init) => this.answer(url, init),
		"contact@example.org",
		this.clock,
	);
	private pages: Page[] = [];
	private reply: () => Promise<Response> = async () =>
		Response.json({ pages: this.pages });
	private readonly requests: { url: string; init: RequestInit }[] = [];

	finds(...pages: Page[]): void {
		this.pages = pages;
	}

	answersWith(reply: () => Promise<Response>): void {
		this.reply = reply;
	}

	slowsDown(retryAfter: string | null): void {
		const headers = new Headers();
		if (retryAfter !== null) headers.set("Retry-After", retryAfter);
		this.reply = async () =>
			new Response("slow down", { status: 429, headers });
	}

	recovers(): void {
		this.reply = async () => Response.json({ pages: this.pages });
	}

	passMilliseconds(milliseconds: number): void {
		this.clock.passMilliseconds(milliseconds);
	}

	async searchFailing(address: string, query: string): Promise<void> {
		await expect(this.search(address, query)).rejects.toBeInstanceOf(
			SearchFailedError,
		);
	}

	providerId() {
		return this.provider.id().toJSON();
	}

	canSearch(address: string): boolean {
		return this.provider.canSearch(entryAt(address));
	}

	async search(address: string, query: string) {
		return this.searchNamed(address, "", query);
	}

	async searchNamed(address: string, name: string, query: string) {
		const entry = entryAt(address, name);
		const results = await this.provider.search(entry, SearchQuery.from(query));
		return results.toJSON();
	}

	requestedUrls(): string[] {
		return this.requests.map((request) => request.url);
	}

	requestedUserAgents(): string[] {
		return this.requests.map((request) => this.userAgentOf(request.init));
	}

	requestedWithTimeout(): boolean {
		const signals = this.requests.map((request) => request.init.signal);
		return signals.every((signal) => signal instanceof AbortSignal);
	}

	private userAgentOf(init: RequestInit): string {
		const headers = new Headers(init.headers);
		return headers.get("User-Agent") ?? "";
	}

	private async answer(url: string, init: RequestInit): Promise<Response> {
		this.requests.push({ url, init });
		return this.reply();
	}
}
