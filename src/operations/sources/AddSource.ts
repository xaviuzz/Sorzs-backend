import type { Call } from "../../call/Call.ts";
import { Source } from "../../domain/source/Source.ts";
import { SourceAddress } from "../../domain/source/SourceAddress.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import { SourceName } from "../../domain/source-list/SourceName.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class AddSource implements JsonHandler {
	readonly name = "sources.add";

	constructor(private readonly repository: SourceListRepository) {}

	async execute(call: Call): Promise<unknown> {
		const address = SourceAddress.from(call.body.requireText("address"));
		const name = SourceName.from(call.body.requireText("name"));
		const list = await this.repository.load();
		const entry = list.add(Source.register(address), name);
		await this.repository.save(list);
		return entry.toJSON();
	}
}
