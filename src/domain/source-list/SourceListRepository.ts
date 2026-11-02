import type { Username } from "../user/Username.ts";
import type { SourceEntry } from "./SourceEntry.ts";
import type { SourceList } from "./SourceList.ts";

export interface SourceListRepository {
	load(owner: Username): Promise<SourceList>;
	add(owner: Username, entry: SourceEntry): Promise<void>;
}
