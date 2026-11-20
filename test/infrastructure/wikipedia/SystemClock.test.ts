import { expect, test } from "bun:test";
import { SystemClock } from "../../../src/infrastructure/wikipedia/SystemClock.ts";

test("tells the current time in milliseconds", () => {
	const before = Date.now();

	const now = new SystemClock().now();

	expect(now).toBeGreaterThanOrEqual(before);
	expect(now).toBeLessThanOrEqual(Date.now());
});
