import type { PageInfo } from "./PageInfo.ts";
import type { SorzAddress } from "./SorzAddress.ts";

export interface PageReader {
	read(address: SorzAddress): Promise<PageInfo>;
}
