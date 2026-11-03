import type { SourceList } from "./SourceList.ts";

type CensusLine = {
	address: string;
	favicon: string | null;
	users: number;
};

export class SourceCensus {
	private constructor(private readonly lines: CensusLine[]) {}

	static of(lists: SourceList[]): SourceCensus {
		const linesByAddress = new Map<string, CensusLine>();
		for (const list of lists) {
			SourceCensus.countList(list, linesByAddress);
		}
		const lines = SourceCensus.orderedByAddress([...linesByAddress.values()]);
		return new SourceCensus(lines);
	}

	toJSON(): { sources: CensusLine[] } {
		const sources = this.lines.map((line) => ({ ...line }));
		return { sources };
	}

	private static countList(
		list: SourceList,
		linesByAddress: Map<string, CensusLine>,
	): void {
		for (const entry of list.entries()) {
			const { address, favicon } = entry.toJSON();
			const known = linesByAddress.get(address);
			if (known) known.users += 1;
			if (!known) linesByAddress.set(address, { address, favicon, users: 1 });
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
