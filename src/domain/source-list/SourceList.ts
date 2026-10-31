import type { Source } from "../source/Source.ts";
import { AddressAlreadyRegisteredError } from "./AddressAlreadyRegisteredError.ts";
import { NameTakenError } from "./NameTakenError.ts";
import { SourceEntry } from "./SourceEntry.ts";
import type { SourceName } from "./SourceName.ts";

export class SourceList {
	private readonly held: SourceEntry[] = [];

	add(source: Source, name: SourceName): SourceEntry {
		this.refuseRepeatedAddress(source);
		this.refuseRepeatedName(name);
		const entry = new SourceEntry(source, name);
		this.held.push(entry);
		return entry;
	}

	entries(): SourceEntry[] {
		return [...this.held];
	}

	private refuseRepeatedAddress(source: Source): void {
		const repeated = this.held.find((entry) =>
			entry.isForSameAddressAs(source),
		);
		if (repeated)
			throw new AddressAlreadyRegisteredError(
				"that address is already in your list",
			);
	}

	private refuseRepeatedName(name: SourceName): void {
		const repeated = this.held.find((entry) => entry.isNamed(name));
		if (repeated) throw new NameTakenError("that name is already in your list");
	}
}
