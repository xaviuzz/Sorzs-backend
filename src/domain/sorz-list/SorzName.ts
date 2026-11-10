import { InvalidNameError } from "./InvalidNameError.ts";

const LONGEST_NAME = 60;

export class SorzName {
	private constructor(private readonly text: string) {}

	static from(raw: string): SorzName {
		const text = raw.trim();
		SorzName.requireValidLength(text);
		return new SorzName(text);
	}

	static fromOptional(raw: string): SorzName {
		const text = raw.trim();
		const isGiven = text.length > 0;
		let name = SorzName.none();
		if (isGiven) name = SorzName.from(text);
		return name;
	}

	static fromJSON(json: string | null): SorzName {
		let name = SorzName.none();
		if (json !== null) name = SorzName.from(json);
		return name;
	}

	static none(): SorzName {
		return new SorzName("");
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

	equals(other: SorzName): boolean {
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
