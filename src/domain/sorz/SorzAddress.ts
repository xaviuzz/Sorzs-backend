import { InvalidAddressError } from "./InvalidAddressError.ts";
import { WebAddress } from "./WebAddress.ts";

export class SorzAddress {
	private constructor(private readonly web: WebAddress) {}

	static from(raw: string): SorzAddress {
		const web = new WebAddress(raw.trim());
		SorzAddress.requireWebAddress(web);
		return new SorzAddress(web);
	}

	private static requireWebAddress(web: WebAddress): void {
		const isWebAddress = web.isValid();
		if (!isWebAddress)
			throw new InvalidAddressError(
				"address must be a complete http or https address",
			);
	}

	equals(other: SorzAddress): boolean {
		return this.toString() === other.toString();
	}

	equalsIgnoringFinalSlash(other: SorzAddress): boolean {
		return this.web.equalsIgnoringFinalSlash(other.web);
	}

	prefixes(): SorzAddress[] {
		const prefixes = [];
		for (const prefix of this.web.prefixes())
			prefixes.push(new SorzAddress(prefix));
		return prefixes;
	}

	site(): string {
		return this.web.site();
	}

	toString(): string {
		return this.web.toString();
	}
}
