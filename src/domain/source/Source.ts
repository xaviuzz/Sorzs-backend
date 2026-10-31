import type { SourceAddress } from "./SourceAddress.ts";
import { SourceId } from "./SourceId.ts";

export class Source {
	private constructor(
		private readonly id: SourceId,
		private readonly address: SourceAddress,
	) {}

	static register(address: SourceAddress): Source {
		return new Source(SourceId.generate(), address);
	}

	hasSameAddressAs(other: Source): boolean {
		return this.address.equals(other.address);
	}

	toJSON(): { sourceId: string; address: string } {
		const sourceId = this.id.toString();
		const address = this.address.toString();
		return { sourceId, address };
	}
}
