import { Source } from "../source/Source.ts";
import { SourceName } from "./SourceName.ts";

type EntryJson = {
	sourceId: string;
	name: string | null;
	address: string;
	title: string | null;
	favicon: string | null;
};

export class SourceEntry {
	constructor(
		private readonly source: Source,
		private readonly name: SourceName,
	) {}

	static fromJSON(json: EntryJson): SourceEntry {
		const source = Source.fromJSON(json);
		const name = SourceName.fromJSON(json.name);
		return new SourceEntry(source, name);
	}

	isForSameAddressAs(source: Source): boolean {
		return this.source.hasSameAddressAs(source);
	}

	isNamed(name: SourceName): boolean {
		return this.name.equals(name);
	}

	displayName(): string {
		const label = this.source.label();
		const displayName = this.name.orElse(label);
		return displayName;
	}

	site(): string {
		return this.source.site();
	}

	toJSON(): EntryJson {
		const { sourceId, address, title, favicon } = this.source.toJSON();
		const name = this.name.toJSON();
		return { sourceId, name, address, title, favicon };
	}
}
