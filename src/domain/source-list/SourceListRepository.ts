import type { SourceList } from "./SourceList.ts";

export interface SourceListRepository {
	load(): Promise<SourceList>;
	save(list: SourceList): Promise<void>;
}
