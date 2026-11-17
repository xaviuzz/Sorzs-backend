export type ProviderIdValue = "reddit" | "wikipedia" | "generic";

export class ProviderId {
	private constructor(private readonly value: ProviderIdValue) {}

	static reddit(): ProviderId {
		return new ProviderId("reddit");
	}

	static wikipedia(): ProviderId {
		return new ProviderId("wikipedia");
	}

	static generic(): ProviderId {
		return new ProviderId("generic");
	}

	toJSON(): ProviderIdValue {
		return this.value;
	}
}
