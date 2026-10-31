import { InvalidAddressError } from "./InvalidAddressError.ts";

const WEB_PROTOCOLS = ["http:", "https:"];

export class SourceAddress {
	private constructor(private readonly text: string) {}

	static from(raw: string): SourceAddress {
		const text = raw.trim();
		const isWebAddress = SourceAddress.isWebAddress(text);
		if (!isWebAddress) {
			throw new InvalidAddressError(
				"address must be a complete http or https address",
			);
		}
		return new SourceAddress(text);
	}

	private static isWebAddress(text: string): boolean {
		let isWebAddress = false;
		if (URL.canParse(text)) {
			const protocol = new URL(text).protocol;
			isWebAddress = WEB_PROTOCOLS.includes(protocol);
		}
		return isWebAddress;
	}

	equals(other: SourceAddress): boolean {
		return this.text === other.text;
	}

	toString(): string {
		return this.text;
	}
}
