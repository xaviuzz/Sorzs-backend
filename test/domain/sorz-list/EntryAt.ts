import { FaviconAddress } from "../../../src/domain/sorz/FaviconAddress.ts";
import { PageInfo } from "../../../src/domain/sorz/PageInfo.ts";
import { PageTitle } from "../../../src/domain/sorz/PageTitle.ts";
import { Sorz } from "../../../src/domain/sorz/Sorz.ts";
import { SorzAddress } from "../../../src/domain/sorz/SorzAddress.ts";
import { SorzEntry } from "../../../src/domain/sorz-list/SorzEntry.ts";
import { SorzName } from "../../../src/domain/sorz-list/SorzName.ts";

export function entryAt(address: string, name = ""): SorzEntry {
	const info = new PageInfo(PageTitle.none(), FaviconAddress.none());
	const sorz = Sorz.register(SorzAddress.from(address), info);
	return new SorzEntry(sorz, SorzName.fromOptional(name));
}
