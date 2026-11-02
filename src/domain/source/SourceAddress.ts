import { InvalidAddressError } from "./InvalidAddressError.ts";

const WEB_PROTOCOLS = ["http:", "https:"];

export class SourceAddress {
	private constructor(private readonly text: string) {}

	static from(raw: string): SourceAddress {
		const text = raw.trim();
		SourceAddress.requireWebAddress(text);
		return new SourceAddress(text);
	}

	private static requireWebAddress(text: string): void {
		const isWebAddress = SourceAddress.isWebAddress(text);
		if (!isWebAddress)
			throw new InvalidAddressError(
				"address must be a complete http or https address",
			);
	}

	private static isWebAddress(text: string): boolean {
		if (!URL.canParse(text)) return false;
		const protocol = new URL(text).protocol;
		const isWebAddress = WEB_PROTOCOLS.includes(protocol);
		return isWebAddress;
	}

	equals(other: SourceAddress): boolean {
		return this.text === other.text;
	}

	site(): string {
		const { host, pathname } = new URL(this.text);
		const path = pathname.replace(/\/$/, "");
		const site = `${host}${path}`;
		return site;
	}

	toString(): string {
		return this.text;
	}
}
