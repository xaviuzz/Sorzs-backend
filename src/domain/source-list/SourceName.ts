import { InvalidNameError } from "./InvalidNameError.ts";

const LONGEST_NAME = 60;

export class SourceName {
	private constructor(private readonly text: string) {}

	static from(raw: string): SourceName {
		const text = raw.trim();
		SourceName.requireValidLength(text);
		return new SourceName(text);
	}

	static fromOptional(raw: string): SourceName {
		const text = raw.trim();
		const isGiven = text.length > 0;
		let name = SourceName.none();
		if (isGiven) name = SourceName.from(text);
		return name;
	}

	static none(): SourceName {
		return new SourceName("");
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
		const bothGiven = this.isGiven() && other.isGiven();
		const mine = this.text.toLowerCase();
		const theirs = other.text.toLowerCase();
		const isSameName = bothGiven && mine === theirs;
		return isSameName;
	}

	orElse(fallback: string): string {
		let text = fallback;
		if (this.isGiven()) text = this.text;
		return text;
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.isGiven()) json = this.text;
		return json;
	}

	toString(): string {
		return this.text;
	}

	private isGiven(): boolean {
		return this.text.length > 0;
	}
}
