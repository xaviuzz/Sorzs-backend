import type { Sorz } from "../sorz/Sorz.ts";
import { AddressAlreadyRegisteredError } from "./AddressAlreadyRegisteredError.ts";
import { NameTakenError } from "./NameTakenError.ts";
import { SorzEntry } from "./SorzEntry.ts";
import type { SorzName } from "./SorzName.ts";

export class SorzList {
	private readonly held: SorzEntry[];

	constructor(entries: SorzEntry[] = []) {
		this.held = [...entries];
	}

	add(sorz: Sorz, name: SorzName): SorzEntry {
		this.refuseRepeatedAddress(sorz);
		this.refuseRepeatedName(name);
		const entry = new SorzEntry(sorz, name);
		this.held.push(entry);
		return entry;
	}

	entries(): SorzEntry[] {
		return [...this.held];
	}

	private refuseRepeatedAddress(sorz: Sorz): void {
		const repeated = this.held.find((entry) => entry.isForSameAddressAs(sorz));
		if (repeated)
			throw new AddressAlreadyRegisteredError(
				"that address is already in your list",
			);
	}

	private refuseRepeatedName(name: SorzName): void {
		const repeated = this.held.find((entry) => entry.isNamed(name));
		if (repeated) throw new NameTakenError("that name is already in your list");
	}
}
