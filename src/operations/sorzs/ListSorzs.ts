import type { Call } from "../../call/Call.ts";
import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class ListSorzs implements OwnedHandler {
	readonly name = "sorzs.list";

	constructor(
		private readonly repository: SorzListRepository,
		private readonly providers: SearchProviders,
	) {}

	async execute(_call: Call, owner: Username): Promise<unknown> {
		const list = await this.repository.load(owner);
		const sorzs = list.entries().map((entry) => ({
			...entry.toJSON(),
			provider: this.providers.idFor(entry).toJSON(),
		}));
		return { sorzs };
	}
}
