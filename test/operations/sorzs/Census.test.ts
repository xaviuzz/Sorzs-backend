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

let repository: InMemorySorzListRepository;
let sut: UsersCall;

beforeEach(() => {
	repository = new InMemorySorzListRepository();
	sut = new UsersCall(new Census(repository));
});

test("is named sorzs.census", () => {
	expect(new Census(repository).name).toBe("sorzs.census");
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
			{ address: "https://a.example.com", favicon: null, users: 1 },
			{ address: "https://b.example.com", favicon: null, users: 2 },
		],
	});
});

async function hold(owner: string, address: string): Promise<void> {
	const sorz = Sorz.register(SorzAddress.from(address), PageInfo.none());
	const entry = new SorzEntry(sorz, SorzName.none());
	await repository.add(Username.from(owner), entry);
}
