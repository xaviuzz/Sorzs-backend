import { expect, test } from "bun:test";
import { SearchExcerpt } from "../../../src/infrastructure/http/SearchExcerpt.ts";

test("removes the tags", () => {
	const excerpt = new SearchExcerpt(
		'a <span class="searchmatch">solar</span> b',
	);

	expect(excerpt.plainText()).toBe("a solar b");
});

test("decodes the character references", () => {
	const excerpt = new SearchExcerpt("say &quot;hi&quot; &#039;you&#039;");

	expect(excerpt.plainText()).toBe("say \"hi\" 'you'");
});

test("an empty excerpt is empty text", () => {
	const excerpt = new SearchExcerpt("");

	expect(excerpt.plainText()).toBe("");
});
