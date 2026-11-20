import type { ProviderId, ProviderIdValue } from "./ProviderId.ts";

export class ProviderDescription {
	constructor(
		private readonly id: ProviderId,
		private readonly name: string,
	) {}

	toJSON(): { provider: ProviderIdValue; providerName: string } {
		const provider = this.id.toJSON();
		const providerName = this.name;
		return { provider, providerName };
	}
}
