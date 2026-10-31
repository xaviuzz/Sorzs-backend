import { expect, test } from "bun:test";
import { PageTitle } from "../../../src/domain/source/PageTitle.ts";

test("keeps the title it is given", () => {
	const title = PageTitle.from("Example Domain");

	expect(title.toJSON()).toBe("Example Domain");
});

test("removes spaces at both ends", () => {
	const title = PageTitle.from("  Example Domain \n");

	expect(title.toJSON()).toBe("Example Domain");
});

test("a title empty after trimming is missing", () => {
	const title = PageTitle.from("   ");

	expect(title.toJSON()).toBeNull();
});

test("keeps a title of 200 characters", () => {
	const title = PageTitle.from("a".repeat(200));

	expect(title.toJSON()).toBe("a".repeat(200));
});

test("cuts a longer title to 200 characters", () => {
	const title = PageTitle.from("a".repeat(250));

	expect(title.toJSON()).toBe("a".repeat(200));
});

test("counts the characters after removing spaces", () => {
	const title = PageTitle.from(` ${"a".repeat(200)} `);

	expect(title.toJSON()).toBe("a".repeat(200));
});

test("no title is missing", () => {
	const title = PageTitle.none();

	expect(title.toJSON()).toBeNull();
});
