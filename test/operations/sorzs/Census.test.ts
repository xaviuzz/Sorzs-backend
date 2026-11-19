import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";
import { Census } from "../../../src/operations/sorzs/Census.ts";
import { UsersCall } from "../users/UsersFixture.ts";
import { standardProviders } from "./StandardProviders.ts";

let repository: InMemorySorzListRepository;
let sut: UsersCall;

beforeEach(() => {
	repository = new InMemorySorzListRepository();
	sut = new UsersCall(new Census(repository, standardProviders()));
});

test("is named sorzs.census", () => {
	expect(new Census(repository, standardProviders()).name).toBe("sorzs.census");
});

test("answers no sorzs when no list holds any", async () => {
	await sut.send();

	expect(await sut.body()).toEqual({ sorzs: [] });
});

test("answers every sorz held, ordered by address, with its users", async () => {
	await hold("xaviuzz", "https://b.example.com");
	await hold("ana", "https://b.example.com");
	await hold("ana", "https://a.example.com");

	await sut.send();

	expect(await sut.body()).toEqual({
		sorzs: [
			{
				address: "https://a.example.com",
				favicon: null,
				provider: "generic",
				users: 1,
			},
			{
				address: "https://b.example.com",
				favicon: null,
				provider: "generic",
				users: 2,
			},
		],
	});
});

test("answers the provider that searches each sorz", async () => {
	await hold("xaviuzz", "https://www.reddit.com/r/spain");
	await hold("xaviuzz", "https://example.com");

	await sut.send();

	expect(await sut.body()).toMatchObject({
		sorzs: [{ provider: "generic" }, { provider: "reddit" }],
	});
});

test("answers the wikipedia provider for a language site", async () => {
	await hold("xaviuzz", "https://es.wikipedia.org");

	await sut.send();

	expect(await sut.body()).toMatchObject({
		sorzs: [{ provider: "wikipedia" }],
	});
});

test("answers the geekfeminism provider for its wiki and generic for another fandom wiki", async () => {
	await hold("xaviuzz", "https://geekfeminism.fandom.com");
	await hold("xaviuzz", "https://starwars.fandom.com");

	await sut.send();

	expect(await sut.body()).toMatchObject({
		sorzs: [{ provider: "geekfeminism" }, { provider: "generic" }],
	});
});

async function hold(owner: string, address: string): Promise<void> {
	const sorz = Sorz.register(SorzAddress.from(address), PageInfo.none());
	const entry = new SorzEntry(sorz, SorzName.none());
	await repository.add(Username.from(owner), entry);
}
