import { beforeEach, expect, test } from "bun:test";
import { InMemorySourceListRepository } from "../../../src/infrastructure/InMemorySourceListRepository.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { AddSource } from "../../../src/operations/sources/AddSource.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

test("is named sources.add", () => {
	expect(sut.operationName()).toBe("sources.add");
});

test("adds a source and answers the created entry", async () => {
	await sut.add({ address: "https://example.com", name: "Example" });

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toEqual({ callId: "a-1", status: "ok" });
	expect(reply.body).toEqual({
		sourceId: expect.any(String),
		name: "Example",
		address: "https://example.com",
	});
});

test("trims the address and the name", async () => {
	await sut.add({ address: "  https://example.com  ", name: "  Example  " });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({
		name: "Example",
		address: "https://example.com",
	});
});

test.each([
	["a missing address", { name: "Example" }],
	["an address that is not text", { address: 3, name: "Example" }],
	["an address that is not a web address", { address: "example", name: "E" }],
	["an ftp address", { address: "ftp://example.com", name: "Example" }],
	["a missing name", { address: "https://example.com" }],
	["a name that is not text", { address: "https://example.com", name: 3 }],
	["an empty name", { address: "https://example.com", name: "   " }],
	[
		"a name over 60 characters",
		{ address: "https://example.com", name: "n".repeat(61) },
	],
])("refuses %s with INVALID_BODY", async (_title, body) => {
	await sut.add(body);

	expect(sut.status()).toBe(200);
	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "INVALID_BODY" });
});

test("refuses an address already in the list", async () => {
	await sut.add({ address: "https://example.com", name: "Example" });

	await sut.add({ address: "https://example.com", name: "Other" });

	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "SOURCE_ALREADY_REGISTERED" });
});

test("refuses a name already in the list ignoring case", async () => {
	await sut.add({ address: "https://example.com", name: "Example" });

	await sut.add({ address: "https://other.com", name: "EXAMPLE" });

	const reply = await sut.reply();
	expect(reply.header).toMatchObject({ status: "error" });
	expect(reply.body).toMatchObject({ code: "SOURCE_NAME_TAKEN" });
});

test("refuses the address first when both are in the list", async () => {
	await sut.add({ address: "https://example.com", name: "Example" });

	await sut.add({ address: "https://example.com", name: "Example" });

	const reply = await sut.reply();
	expect(reply.body).toMatchObject({ code: "SOURCE_ALREADY_REGISTERED" });
});

test("a refusal leaves the list unchanged", async () => {
	await sut.add({ address: "https://example.com", name: "Example" });
	await sut.add({ address: "https://example.com", name: "Other" });

	expect(await sut.namesInList()).toEqual(["Example"]);
});

type Reply = { header: Record<string, unknown>; body: unknown };

class SUT {
	private readonly repository = new InMemorySourceListRepository();
	private readonly operation = new JsonOperation(
		new AddSource(this.repository),
	);
	private response = new Response();

	async add(body: unknown): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "a-1" }, body });
		const request = new Request("http://x/sources.add", {
			method: "POST",
			body: payload,
		});
		this.response = await this.operation.serve(request);
	}

	operationName(): string {
		return this.operation.name;
	}

	status(): number {
		return this.response.status;
	}

	async reply(): Promise<Reply> {
		const reply = (await this.response.json()) as Reply;
		return reply;
	}

	async namesInList(): Promise<string[]> {
		const list = await this.repository.load();
		return list.entries().map((entry) => entry.toJSON().name);
	}
}
