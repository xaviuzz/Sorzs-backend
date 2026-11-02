import type { Call } from "../../call/Call.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class ListSources implements OwnedHandler {
	readonly name = "sources.list";

	constructor(private readonly repository: SourceListRepository) {}

	async execute(_call: Call, owner: Username): Promise<unknown> {
		const list = await this.repository.load(owner);
		const sources = list.entries().map((entry) => entry.toJSON());
		return { sources };
	}
}
