import type { Clock } from "./Clock.ts";
import type { RetryAfter } from "./RetryAfter.ts";

export class SlowDowns {
	private readonly freeAgainAt = new Map<string, number>();

	constructor(private readonly clock: Clock) {}

	isSlowFor(language: string): boolean {
		const freeAt = this.freeAgainAt.get(language);
		const hasWait = freeAt !== undefined;
		const isSlow = hasWait && this.clock.now() < freeAt;
		return isSlow;
	}

	startFor(language: string, retryAfter: RetryAfter): void {
		const freeAt = this.clock.now() + retryAfter.milliseconds();
		this.freeAgainAt.set(language, freeAt);
	}
}
