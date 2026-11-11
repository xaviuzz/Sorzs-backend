import type { SearchProviders } from "../search/SearchProviders.ts";
import type { SorzList } from "./SorzList.ts";

type CensusLine = {
	address: string;
	favicon: string | null;
	provider: "reddit" | "generic";
	users: number;
};

export class SorzCensus {
	private constructor(private readonly lines: CensusLine[]) {}

	static of(lists: SorzList[], providers: SearchProviders): SorzCensus {
		const linesByAddress = new Map<string, CensusLine>();
		for (const list of lists) {
			SorzCensus.countList(list, providers, linesByAddress);
		}
		const lines = SorzCensus.orderedByAddress([...linesByAddress.values()]);
		return new SorzCensus(lines);
	}

	toJSON(): { sorzs: CensusLine[] } {
		const sorzs = this.lines.map((line) => ({ ...line }));
		return { sorzs };
	}

	private static countList(
		list: SorzList,
		providers: SearchProviders,
		linesByAddress: Map<string, CensusLine>,
	): void {
		for (const entry of list.entries()) {
			const { address, favicon } = entry.toJSON();
			const provider = providers.idFor(entry).toJSON();
			const known = linesByAddress.get(address);
			if (known) known.users += 1;
			if (!known)
				linesByAddress.set(address, { address, favicon, provider, users: 1 });
		}
	}

	private static orderedByAddress(lines: CensusLine[]): CensusLine[] {
		const ordered = lines.sort((one, other) => {
			const oneKey = one.address.toLowerCase();
			const otherKey = other.address.toLowerCase();
			if (oneKey < otherKey) return -1;
			if (oneKey > otherKey) return 1;
			return 0;
		});
		return ordered;
	}
}
