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

class SUT {
	private readonly repository = new InMemorySorzListRepository();
	private readonly adding = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new AddSorz(
				this.repository,
				new FakePageReader(),
				new SearchProvidersFactory().build(),
			),
		),
	);
	private readonly searching = new JsonOperation(
		new OwnedBy(
			xaviuzz,
			new SearchSorzs(this.repository, new SearchProvidersFactory().build()),
		),
	);

	async addSorz(address: string): Promise<void> {
		await this.post(this.adding, "sorzs.add", { address, name: "" });
	}

	async titlesOfSearch(query: string): Promise<string[]> {
		const response = await this.post(this.searching, "sorzs.search", {
			query,
		});
		const reply = (await response.json()) as {
			body: { results: { title: string }[] };
		};
		const titles: string[] = [];
		for (const result of reply.body.results) titles.push(result.title);
		return titles;
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
