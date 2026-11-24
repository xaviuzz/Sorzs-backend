import { FaviconAddress } from "../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../src/domain/sorz/PageInfo.ts";
import type { PageReader } from "../src/domain/sorz/PageReader.ts";
import { PageTitle } from "../src/domain/sorz/PageTitle.ts";
import type { SorzAddress } from "../src/domain/sorz/SorzAddress.ts";
import type { Latency } from "./Latency.ts";

export class LatentPageReader implements PageReader {
	constructor(private readonly latency: Latency) {}

	async read(_address: SorzAddress): Promise<PageInfo> {
		await this.latency.pass();
		return new PageInfo(
			PageTitle.from("Benchmark page"),
			FaviconAddress.none(),
		);
	}
}
