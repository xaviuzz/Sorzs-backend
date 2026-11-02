import { WebAddress } from "./WebAddress.ts";

export class FaviconAddress {
	private constructor(private readonly text: string) {}

	static from(raw: string): FaviconAddress {
		const text = raw.trim();
		let favicon = FaviconAddress.none();
		const isWebAddress = new WebAddress(text).isValid();
		if (isWebAddress) favicon = new FaviconAddress(text);
		return favicon;
	}

	static none(): FaviconAddress {
		return new FaviconAddress("");
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.text.length > 0) json = this.text;
		return json;
	}
}
