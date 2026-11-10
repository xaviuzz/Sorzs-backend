import { expect, test } from "bun:test";
import { InvalidAddressError } from "../../../src/domain/sorz/InvalidAddressError.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";

test("accepts an http address", () => {
	const address = SorzAddress.from("http://example.com");

	expect(address.toString()).toBe("http://example.com");
});

test("accepts an https address", () => {
	const address = SorzAddress.from("https://example.com/docs");

	expect(address.toString()).toBe("https://example.com/docs");
});

test("removes spaces at both ends", () => {
	const address = SorzAddress.from("  https://example.com  ");

	expect(address.toString()).toBe("https://example.com");
});

test("refuses an address that is not http or https", () => {
	expect(() => SorzAddress.from("ftp://example.com")).toThrow(
		InvalidAddressError,
	);
});

test("refuses text that is not a complete address", () => {
	expect(() => SorzAddress.from("example.com")).toThrow(InvalidAddressError);
	expect(() => SorzAddress.from("/docs")).toThrow(InvalidAddressError);
	expect(() => SorzAddress.from("   ")).toThrow(InvalidAddressError);
});

test("two addresses written the same are equal", () => {
	const first = SorzAddress.from("https://example.com");
	const second = SorzAddress.from(" https://example.com ");

	expect(first.equals(second)).toBe(true);
});

test("a trailing slash makes a different address", () => {
	const first = SorzAddress.from("https://example.com");
	const second = SorzAddress.from("https://example.com/");

	expect(first.equals(second)).toBe(false);
});

test("letter case makes a different address", () => {
	const first = SorzAddress.from("https://example.com/Docs");
	const second = SorzAddress.from("https://example.com/docs");

	expect(first.equals(second)).toBe(false);
});

test("its refusal carries the invalid body code", () => {
	const refusal = new InvalidAddressError("bad");

	expect(refusal.code).toBe("INVALID_BODY");
});

test("names the site as host and path", () => {
	const address = SorzAddress.from("https://example.com/docs");

	expect(address.site()).toBe("example.com/docs");
});

test("names the site without the closing slash", () => {
	const address = SorzAddress.from("https://example.com/");

	expect(address.site()).toBe("example.com");
});
