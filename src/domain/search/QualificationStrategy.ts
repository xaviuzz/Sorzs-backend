import type { SorzEntry } from "../sorz-list/SorzEntry.ts";

export interface QualificationStrategy {
	qualifies(entry: SorzEntry): boolean;
}
