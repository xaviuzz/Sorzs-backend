import type { Clock } from "./Clock.ts";

export class SystemClock implements Clock {
	now(): number {
		return Date.now();
	}
}
