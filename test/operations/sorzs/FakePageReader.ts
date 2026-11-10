import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import type { PageReader } from "../../../src/domain/sorz/PageReader.ts";
import type { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";

export class FakePageReader implements PageReader {
	private readonly pages = new Map<string, PageInfo>();
	private readonly readAddresses: string[] = [];

	offers(address: string, info: PageInfo): void {
		this.pages.set(address, info);
	}

	async read(address: SorzAddress): Promise<PageInfo> {
		const text = address.toString();
		this.readAddresses.push(text);
		const info = this.pages.get(text) ?? PageInfo.none();
		return info;
	}

	reads(): string[] {
		return [...this.readAddresses];
	}
}
