import type { PageInfo } from "./PageInfo.ts";
import type { SourceAddress } from "./SourceAddress.ts";

export interface PageReader {
	read(address: SourceAddress): Promise<PageInfo>;
}
