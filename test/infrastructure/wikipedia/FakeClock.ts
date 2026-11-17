import type { Clock } from "../../../src/infrastructure/wikipedia/Clock.ts";

export class FakeClock implements Clock {
	private milliseconds = 1_000_000;

	now(): number {
		return this.milliseconds;
	}

	pass(seconds: number): void {
		this.milliseconds += seconds * 1000;
	}

	passMilliseconds(milliseconds: number): void {
		this.milliseconds += milliseconds;
	}
}
