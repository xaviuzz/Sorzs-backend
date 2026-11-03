import { beforeEach, expect, test } from "bun:test";
import { PageInfo } from "../../../src/domain/source/PageInfo.ts";
import { Source } from "../../../src/domain/source/Source.ts";
import { SourceAddress } from "../../../src/domain/source/SourceAddress.ts";
import { SourceEntry } from "../../../src/domain/source-list/SourceEntry.ts";
import { SourceName } from "../../../src/domain/source-list/SourceName.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";
import { ListSorzsSources } from "../../../src/operations/sorzs/ListSorzsSources.ts";
import { UsersCall } from "../users/UsersFixture.ts";

let repository: InMemorySourceListRepository;
let sut: UsersCall;

beforeEach(() => {
	repository = new InMemorySourceListRepository();
	sut = new UsersCall(new ListSorzsSources(repository));
});

test("is named sorzs.sources", () => {
	expect(new ListSorzsSources(repository).name).toBe("sorzs.sources");
});

test("answers no sources when no list holds any", async () => {
	await sut.send();

	expect(await sut.body()).toEqual({ sources: [] });
});

test("answers every source held, ordered by address, with its users", async () => {
	await hold("xaviuzz", "https://b.example.com");
	await hold("ana", "https://b.example.com");
	await hold("ana", "https://a.example.com");

	await sut.send();

	expect(await sut.body()).toEqual({
		sources: [
			{ address: "https://a.example.com", favicon: null, users: 1 },
			{ address: "https://b.example.com", favicon: null, users: 2 },
		],
	});
});

async function hold(owner: string, address: string): Promise<void> {
	const source = Source.register(SourceAddress.from(address), PageInfo.none());
	const entry = new SourceEntry(source, SourceName.none());
	await repository.add(Username.from(owner), entry);
}
