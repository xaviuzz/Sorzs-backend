import { expect, test } from "bun:test";
import { CandidateAddresses } from "../../../src/domain/sorz/CandidateAddresses.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";

function candidatesOf(text: string): string[] {
	const address = SorzAddress.from(text);
	const candidates = CandidateAddresses.from(address).list();
	const texts = candidates.map((candidate) => candidate.toString());
	return texts;
}

test("a bare origin is its own only candidate", () => {
	expect(candidatesOf("https://www.talk.com")).toEqual([
		"https://www.talk.com",
	]);
});

test("a deep address gives the origin, each prefix and itself", () => {
	expect(candidatesOf("https://www.talk.com/dfe/dert/deftgh.html")).toEqual([
		"https://www.talk.com",
		"https://www.talk.com/dfe",
		"https://www.talk.com/dfe/dert",
		"https://www.talk.com/dfe/dert/deftgh.html",
	]);
});

test("the pasted address is kept exactly as pasted", () => {
	expect(candidatesOf("  https://talk.com/dfe/?q=1#top  ")).toEqual([
		"https://talk.com",
		"https://talk.com/dfe",
		"https://talk.com/dfe/?q=1#top",
	]);
});

test("a derived address that differs from the pasted only by the final slash is dropped", () => {
	expect(candidatesOf("https://talk.com/dfe/")).toEqual([
		"https://talk.com",
		"https://talk.com/dfe/",
	]);
});

test("an origin pasted with a final slash is its own only candidate", () => {
	expect(candidatesOf("https://talk.com/")).toEqual(["https://talk.com/"]);
});

test("derived candidates carry no query or fragment", () => {
	expect(candidatesOf("https://talk.com/a/b?x=1#y")).toEqual([
		"https://talk.com",
		"https://talk.com/a",
		"https://talk.com/a/b",
		"https://talk.com/a/b?x=1#y",
	]);
});

test("keeps the origin and the four deepest", () => {
	expect(candidatesOf("https://talk.com/a/b/c/d/e/f")).toEqual([
		"https://talk.com",
		"https://talk.com/a/b/c",
		"https://talk.com/a/b/c/d",
		"https://talk.com/a/b/c/d/e",
		"https://talk.com/a/b/c/d/e/f",
	]);
});
