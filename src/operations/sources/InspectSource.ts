import type { Call } from "../../call/Call.ts";
import type { PageReader } from "../../domain/source/PageReader.ts";
import { SourceAddress } from "../../domain/source/SourceAddress.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class InspectSource implements JsonHandler {
	readonly name = "sources.inspect";

	constructor(private readonly reader: PageReader) {}

	async execute(call: Call): Promise<unknown> {
		const address = SourceAddress.from(call.body.requireText("address"));
		const info = await this.reader.read(address);
		return info.toJSON();
	}
}
