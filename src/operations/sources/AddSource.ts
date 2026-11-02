import type { Call } from "../../call/Call.ts";
import type { PageReader } from "../../domain/source/PageReader.ts";
import { Source } from "../../domain/source/Source.ts";
import { SourceAddress } from "../../domain/source/SourceAddress.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import { SourceName } from "../../domain/source-list/SourceName.ts";
import type { Username } from "../../domain/user/Username.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class AddSource implements OwnedHandler {
	readonly name = "sources.add";

	constructor(
		private readonly repository: SourceListRepository,
		private readonly reader: PageReader,
	) {}

	async execute(call: Call, owner: Username): Promise<unknown> {
		const address = SourceAddress.from(call.body.requireText("address"));
		const name = SourceName.fromOptional(call.body.optionalText("name"));
		const info = await this.reader.read(address);
		const list = await this.repository.load(owner);
		const entry = list.add(Source.register(address, info), name);
		await this.repository.add(owner, entry);
		return entry.toJSON();
	}
}
