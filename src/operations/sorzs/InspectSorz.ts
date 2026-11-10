import type { Call } from "../../call/Call.ts";
import { CandidateAddresses } from "../../domain/sorz/CandidateAddresses.ts";
import type { PageInfo } from "../../domain/sorz/PageInfo.ts";
import type { PageReader } from "../../domain/sorz/PageReader.ts";
import { SorzAddress } from "../../domain/sorz/SorzAddress.ts";
import type { OwnedHandler } from "../OwnedHandler.ts";

export class InspectSorz implements OwnedHandler {
	readonly name = "sorzs.inspect";

	constructor(private readonly reader: PageReader) {}

	async execute(call: Call): Promise<unknown> {
		const pasted = SorzAddress.from(call.body.requireText("address"));
		const addresses = CandidateAddresses.from(pasted).list();
		const infos = await this.readAll(addresses);
		const pastedInfo = infos[infos.length - 1] as PageInfo;
		const candidates = this.titledCandidates(addresses, infos);
		const reply = { ...pastedInfo.toJSON(), candidates };
		return reply;
	}

	private readAll(addresses: SorzAddress[]): Promise<PageInfo[]> {
		const reads = addresses.map((address) => this.reader.read(address));
		return Promise.all(reads);
	}

	private titledCandidates(addresses: SorzAddress[], infos: PageInfo[]) {
		const candidates = [];
		for (let index = 0; index < addresses.length; index++) {
			const info = infos[index] as PageInfo;
			const address = addresses[index] as SorzAddress;
			if (info.hasTitle()) candidates.push(info.toCandidateJSON(address));
		}
		return candidates;
	}
}
