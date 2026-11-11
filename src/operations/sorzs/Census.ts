import type { Call } from "../../call/Call.ts";
import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { SorzCensus } from "../../domain/sorz-list/SorzCensus.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class Census implements OwnedHandler {
	readonly name = "sorzs.census";

	constructor(
		private readonly repository: SorzListRepository,
		private readonly providers: SearchProviders,
	) {}

	async execute(_call: Call, _asker: Username): Promise<unknown> {
		const lists = await this.repository.loadEveryList();
		const census = SorzCensus.of(lists, this.providers);
		return census.toJSON();
	}
}
