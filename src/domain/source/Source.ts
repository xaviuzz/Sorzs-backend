import { PageInfo } from "./PageInfo.ts";
import { SourceAddress } from "./SourceAddress.ts";
import { SourceId } from "./SourceId.ts";

type SourceJson = {
	sourceId: string;
	address: string;
	title: string | null;
	favicon: string | null;
};

export class Source {
	private constructor(
		private readonly id: SourceId,
		private readonly address: SourceAddress,
		private readonly pageInfo: PageInfo,
	) {}

	static register(address: SourceAddress, pageInfo: PageInfo): Source {
		return new Source(SourceId.generate(), address, pageInfo);
	}

	static fromJSON(json: SourceJson): Source {
		const id = SourceId.from(json.sourceId);
		const address = SourceAddress.from(json.address);
		const pageInfo = PageInfo.fromJSON(json);
		return new Source(id, address, pageInfo);
	}

	hasSameAddressAs(other: Source): boolean {
		return this.address.equals(other.address);
	}

	label(): string {
		const address = this.address.toString();
		const label = this.pageInfo.titleOr(address);
		return label;
	}

	site(): string {
		return this.address.site();
	}

	toJSON(): SourceJson {
		const sourceId = this.id.toString();
		const address = this.address.toString();
		const { title, favicon } = this.pageInfo.toJSON();
		return { sourceId, address, title, favicon };
	}
}
