import { InvalidNameError } from "./InvalidNameError.ts";

const LONGEST_NAME = 60;

export class SourceName {
	private constructor(private readonly text: string) {}

	static from(raw: string): SourceName {
		const text = raw.trim();
		const isPresent = text.length > 0;
		const isShortEnough = text.length <= LONGEST_NAME;
		if (!isPresent || !isShortEnough) {
			throw new InvalidNameError(
				`name must have between 1 and ${LONGEST_NAME} characters`,
			);
		}
		return new SourceName(text);
	}

	equals(other: SourceName): boolean {
		const mine = this.text.toLowerCase();
		const theirs = other.text.toLowerCase();
		return mine === theirs;
	}

	toString(): string {
		return this.text;
	}
}
