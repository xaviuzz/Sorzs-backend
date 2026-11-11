import type { Call } from "../../call/Call.ts";
import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import type { PageReader } from "../../domain/sorz/PageReader.ts";
import { Sorz } from "../../domain/sorz/Sorz.ts";
import { SorzAddress } from "../../domain/sorz/SorzAddress.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import { SorzName } from "../../domain/sorz-list/SorzName.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class AddSorz implements OwnedHandler {
	readonly name = "sorzs.add";

	constructor(
		private readonly repository: SorzListRepository,
		private readonly reader: PageReader,
		private readonly providers: SearchProviders,
	) {}

	async execute(call: Call, owner: Username): Promise<unknown> {
		const address = SorzAddress.from(call.body.requireText("address"));
		const name = SorzName.fromOptional(call.body.optionalText("name"));
		const info = await this.reader.read(address);
		const list = await this.repository.load(owner);
		const entry = list.add(Sorz.register(address, info), name);
		await this.repository.add(owner, entry);
		const provider = this.providers.idFor(entry).toJSON();
		return { ...entry.toJSON(), provider };
	}
}
