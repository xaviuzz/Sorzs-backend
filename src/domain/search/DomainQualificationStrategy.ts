import type { SorzEntry } from "../sorz-list/SorzEntry.ts";
import type { QualificationStrategy } from "./QualificationStrategy.ts";

export class DomainQualificationStrategy implements QualificationStrategy {
	constructor(private readonly domain: string) {}

	qualifies(entry: SorzEntry): boolean {
		const { hostname } = new URL(`https://${entry.site()}`);
		const isTheDomain = hostname === this.domain;
		const isASubdomain = hostname.endsWith(`.${this.domain}`);
		const qualifies = isTheDomain || isASubdomain;
		return qualifies;
	}
}
