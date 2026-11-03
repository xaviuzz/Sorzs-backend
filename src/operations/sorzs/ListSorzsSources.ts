import type { Call } from "../../call/Call.ts";
import { SourceCensus } from "../../domain/source-list/SourceCensus.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class ListSorzsSources implements OwnedHandler {
	readonly name = "sorzs.sources";

	constructor(private readonly repository: SourceListRepository) {}

	async execute(_call: Call, _asker: Username): Promise<unknown> {
		const lists = await this.repository.loadEveryList();
		const census = SourceCensus.of(lists);
		return census.toJSON();
	}
}
