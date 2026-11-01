import type { Source } from "../source/Source.ts";
import type { SourceName } from "./SourceName.ts";

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

	isForSameAddressAs(source: Source): boolean {
		return this.source.hasSameAddressAs(source);
	}

	isNamed(name: SourceName): boolean {
		return this.name.equals(name);
	}

	displayName(): string {
		const { address, title } = this.source.toJSON();
		const name = this.name.toJSON();
		let displayName = address;
		if (title) displayName = title;
		if (name) displayName = name;
		return displayName;
	}

	toJSON(): EntryJson {
		const { sourceId, address, title, favicon } = this.source.toJSON();
		const name = this.name.toJSON();
		return { sourceId, name, address, title, favicon };
	}
}
