import { SourceAddress } from "./SourceAddress.ts";

const DEEPEST_KEPT = 4;

export class CandidateAddresses {
	private constructor(private readonly addresses: SourceAddress[]) {}

	static from(pasted: SourceAddress): CandidateAddresses {
		const derived = CandidateAddresses.deriveFrom(pasted);
		const withoutTwin = CandidateAddresses.withoutTwinOf(pasted, derived);
		const all = [...withoutTwin, pasted];
		const capped = CandidateAddresses.capped(all);
		return new CandidateAddresses(capped);
	}

	private static deriveFrom(pasted: SourceAddress): SourceAddress[] {
		const url = new URL(pasted.toString());
		const segments = url.pathname.split("/").filter((segment) => segment);
		const derived = [SourceAddress.from(url.origin)];
		let path = "";
		for (const segment of segments) {
			path = `${path}/${segment}`;
			derived.push(SourceAddress.from(`${url.origin}${path}`));
		}
		return derived;
	}

	private static withoutTwinOf(
		pasted: SourceAddress,
		derived: SourceAddress[],
	): SourceAddress[] {
		const pastedWithoutSlash = pasted.toString().replace(/\/$/, "");
		const kept: SourceAddress[] = [];
		for (const address of derived) {
			const isTwin = address.toString() === pastedWithoutSlash;
			if (!isTwin) kept.push(address);
		}
		return kept;
	}

	private static capped(all: SourceAddress[]): SourceAddress[] {
		const origin = all.slice(0, 1);
		const rest = all.slice(1);
		const deepest = rest.slice(-DEEPEST_KEPT);
		const capped = [...origin, ...deepest];
		return capped;
	}

	list(): SourceAddress[] {
		return [...this.addresses];
	}
}
