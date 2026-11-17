const DEFAULT_SECONDS = 60;
const WHOLE_SECONDS = /^\d+$/;

export class RetryAfter {
	private constructor(private readonly seconds: number) {}

	static from(header: string | null): RetryAfter {
		let seconds = DEFAULT_SECONDS;
		const isWholeSeconds = header !== null && WHOLE_SECONDS.test(header.trim());
		if (isWholeSeconds) seconds = Number(header);
		return new RetryAfter(seconds);
	}

	milliseconds(): number {
		return this.seconds * 1000;
	}
}
