import type { Call } from "../../call/Call.ts";
import { CandidateAddresses } from "../../domain/source/CandidateAddresses.ts";
import type { PageInfo } from "../../domain/source/PageInfo.ts";
import type { PageReader } from "../../domain/source/PageReader.ts";
import { SourceAddress } from "../../domain/source/SourceAddress.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class InspectSource implements JsonHandler {
	readonly name = "sources.inspect";

	constructor(private readonly reader: PageReader) {}

	async execute(call: Call): Promise<unknown> {
		const pasted = SourceAddress.from(call.body.requireText("address"));
		const addresses = CandidateAddresses.from(pasted).list();
		const infos = await this.readAll(addresses);
		const pastedInfo = infos[infos.length - 1] as PageInfo;
		const candidates = this.titledCandidates(addresses, infos);
		const reply = { ...pastedInfo.toJSON(), candidates };
		return reply;
	}

	private readAll(addresses: SourceAddress[]): Promise<PageInfo[]> {
		const reads = addresses.map((address) => this.reader.read(address));
		return Promise.all(reads);
	}

	private titledCandidates(addresses: SourceAddress[], infos: PageInfo[]) {
		const candidates = [];
		for (let index = 0; index < addresses.length; index++) {
			const info = infos[index] as PageInfo;
			const address = addresses[index] as SourceAddress;
			if (info.hasTitle()) candidates.push(info.toCandidateJSON(address));
		}
		return candidates;
	}
}
