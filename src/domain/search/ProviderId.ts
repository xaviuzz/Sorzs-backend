export type ProviderIdValue = "reddit" | "generic";

export class ProviderId {
	private constructor(private readonly value: ProviderIdValue) {}

	static reddit(): ProviderId {
		return new ProviderId("reddit");
	}

	static generic(): ProviderId {
		return new ProviderId("generic");
	}

	toJSON(): ProviderIdValue {
		return this.value;
	}
}
