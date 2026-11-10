import { Sorz } from "../sorz/Sorz.ts";
import { SorzName } from "./SorzName.ts";

type EntryJson = {
	sorzId: string;
	name: string | null;
	address: string;
	title: string | null;
	favicon: string | null;
};

export class SorzEntry {
	constructor(
		private readonly sorz: Sorz,
		private readonly name: SorzName,
	) {}

	static fromJSON(json: EntryJson): SorzEntry {
		const sorz = Sorz.fromJSON(json);
		const name = SorzName.fromJSON(json.name);
		return new SorzEntry(sorz, name);
	}

	isForSameAddressAs(sorz: Sorz): boolean {
		return this.sorz.hasSameAddressAs(sorz);
	}

	isNamed(name: SorzName): boolean {
		return this.name.equals(name);
	}

	displayName(): string {
		const label = this.sorz.label();
		const displayName = this.name.orElse(label);
		return displayName;
	}

	site(): string {
		return this.sorz.site();
	}

	toJSON(): EntryJson {
		const { sorzId, address, title, favicon } = this.sorz.toJSON();
		const name = this.name.toJSON();
		return { sorzId, name, address, title, favicon };
	}
}
