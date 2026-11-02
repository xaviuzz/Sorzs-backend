import { InvalidAddressError } from "./InvalidAddressError.ts";
import { WebAddress } from "./WebAddress.ts";

export class SourceAddress {
	private constructor(private readonly web: WebAddress) {}

	static from(raw: string): SourceAddress {
		const web = new WebAddress(raw.trim());
		SourceAddress.requireWebAddress(web);
		return new SourceAddress(web);
	}

	private static requireWebAddress(web: WebAddress): void {
		const isWebAddress = web.isValid();
		if (!isWebAddress)
			throw new InvalidAddressError(
				"address must be a complete http or https address",
			);
	}

	equals(other: SourceAddress): boolean {
		return this.toString() === other.toString();
	}

	equalsIgnoringFinalSlash(other: SourceAddress): boolean {
		return this.web.equalsIgnoringFinalSlash(other.web);
	}

	prefixes(): SourceAddress[] {
		const prefixes = [];
		for (const prefix of this.web.prefixes())
			prefixes.push(new SourceAddress(prefix));
		return prefixes;
	}

	site(): string {
		return this.web.site();
	}

	toString(): string {
		return this.web.toString();
	}
}
