import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class ListSources implements JsonHandler {
	readonly name = "sources.list";

	constructor(private readonly repository: SourceListRepository) {}

	async execute(): Promise<unknown> {
		const list = await this.repository.load();
		const sources = list.entries().map((entry) => entry.toJSON());
		return { sources };
	}
}
