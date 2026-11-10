import type { SorzAddress } from "./SorzAddress.ts";

const DEEPEST_KEPT = 4;

export class CandidateAddresses {
	private constructor(private readonly addresses: SorzAddress[]) {}

	static from(pasted: SorzAddress): CandidateAddresses {
		const derived = pasted.prefixes();
		const withoutTwin = CandidateAddresses.withoutTwinOf(pasted, derived);
		const all = [...withoutTwin, pasted];
		const capped = CandidateAddresses.capped(all);
		return new CandidateAddresses(capped);
	}

	private static withoutTwinOf(
		pasted: SorzAddress,
		derived: SorzAddress[],
	): SorzAddress[] {
		const kept: SorzAddress[] = [];
		for (const address of derived) {
			const isTwin = address.equalsIgnoringFinalSlash(pasted);
			if (!isTwin) kept.push(address);
		}
		return kept;
	}

	private static capped(all: SorzAddress[]): SorzAddress[] {
		const origin = all.slice(0, 1);
		const rest = all.slice(1);
		const deepest = rest.slice(-DEEPEST_KEPT);
		const capped = [...origin, ...deepest];
		return capped;
	}

	list(): SorzAddress[] {
		return [...this.addresses];
	}
}
