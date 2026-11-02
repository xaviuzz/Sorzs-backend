import { WebAddress } from "./WebAddress.ts";

export class FaviconAddress {
	private constructor(private readonly web: WebAddress) {}

	static from(raw: string): FaviconAddress {
		const web = new WebAddress(raw.trim());
		return FaviconAddress.of(web);
	}

	static of(web: WebAddress): FaviconAddress {
		let favicon = FaviconAddress.none();
		if (web.isValid()) favicon = new FaviconAddress(web);
		return favicon;
	}

	static none(): FaviconAddress {
		return new FaviconAddress(new WebAddress(""));
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.web.isValid()) json = this.web.toString();
		return json;
	}
}
