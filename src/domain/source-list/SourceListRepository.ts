import type { SourceEntry } from "./SourceEntry.ts";
import type { SourceList } from "./SourceList.ts";

export interface SourceListRepository {
	load(): Promise<SourceList>;
	add(entry: SourceEntry): Promise<void>;
}
