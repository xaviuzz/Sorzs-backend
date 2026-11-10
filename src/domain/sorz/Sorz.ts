import { PageInfo } from "./PageInfo.ts";
import { SorzAddress } from "./SorzAddress.ts";
import { SorzId } from "./SorzId.ts";

type SorzJson = {
	sorzId: string;
	address: string;
	title: string | null;
	favicon: string | null;
};

export class Sorz {
	private constructor(
		private readonly id: SorzId,
		private readonly address: SorzAddress,
		private readonly pageInfo: PageInfo,
	) {}

	static register(address: SorzAddress, pageInfo: PageInfo): Sorz {
		return new Sorz(SorzId.generate(), address, pageInfo);
	}

	static fromJSON(json: SorzJson): Sorz {
		const id = SorzId.from(json.sorzId);
		const address = SorzAddress.from(json.address);
		const pageInfo = PageInfo.fromJSON(json);
		return new Sorz(id, address, pageInfo);
	}

	hasSameAddressAs(other: Sorz): boolean {
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

	toJSON(): SorzJson {
		const sorzId = this.id.toString();
		const address = this.address.toString();
		const { title, favicon } = this.pageInfo.toJSON();
		return { sorzId, address, title, favicon };
	}
}
