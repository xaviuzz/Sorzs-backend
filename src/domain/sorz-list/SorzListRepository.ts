import type { Username } from "../user/Username.ts";
import type { SorzEntry } from "./SorzEntry.ts";
import type { SorzList } from "./SorzList.ts";

export interface SorzListRepository {
	load(owner: Username): Promise<SorzList>;
	loadEveryList(): Promise<SorzList[]>;
	add(owner: Username, entry: SorzEntry): Promise<void>;
}
