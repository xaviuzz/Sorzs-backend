const WEB_PROTOCOLS = ["http:", "https:"];

export class FaviconAddress {
	private constructor(private readonly text: string) {}

	static from(raw: string): FaviconAddress {
		const text = raw.trim();
		let favicon = FaviconAddress.none();
		if (FaviconAddress.isWebAddress(text)) favicon = new FaviconAddress(text);
		return favicon;
	}

	static none(): FaviconAddress {
		return new FaviconAddress("");
	}

	private static isWebAddress(text: string): boolean {
		if (!URL.canParse(text)) return false;
		const protocol = new URL(text).protocol;
		const isWebAddress = WEB_PROTOCOLS.includes(protocol);
		return isWebAddress;
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.text.length > 0) json = this.text;
		return json;
	}
}
