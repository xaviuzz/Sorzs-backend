import type { Source } from "../source/Source.ts";
import type { SourceName } from "./SourceName.ts";

type EntryJson = { sourceId: string; name: string; address: string };

export class SourceEntry {
	constructor(
		private readonly source: Source,
		private readonly name: SourceName,
	) {}

	isForSameAddressAs(source: Source): boolean {
		return this.source.hasSameAddressAs(source);
	}

	isNamed(name: SourceName): boolean {
		return this.name.equals(name);
	}

	toJSON(): EntryJson {
		const { sourceId, address } = this.source.toJSON();
		const name = this.name.toString();
		return { sourceId, name, address };
	}
}
