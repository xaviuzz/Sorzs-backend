import type { SorzEntry } from "../sorz-list/SorzEntry.ts";
import type { QualificationStrategy } from "./QualificationStrategy.ts";
import { WikipediaSite } from "./WikipediaSite.ts";

export class WikipediaQualificationStrategy implements QualificationStrategy {
	qualifies(entry: SorzEntry): boolean {
		const site = new WikipediaSite(entry.hostname());
		const qualifies = site.isWikipedia();
		return qualifies;
	}
}
