import { InvalidNameError } from "./InvalidNameError.ts";

const LONGEST_NAME = 60;

export class SourceName {
	private constructor(private readonly text: string) {}

	static from(raw: string): SourceName {
		const text = raw.trim();
		SourceName.requireValidLength(text);
		return new SourceName(text);
	}

	private static requireValidLength(text: string): void {
		const isPresent = text.length > 0;
		const isShortEnough = text.length <= LONGEST_NAME;
		const isValid = isPresent && isShortEnough;
		if (!isValid)
			throw new InvalidNameError(
				`name must have between 1 and ${LONGEST_NAME} characters`,
			);
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
