export type ProviderIdValue =
	| "reddit"
	| "wikipedia"
	| "geekfeminism"
	| "generic";

export class ProviderId {
	private constructor(private readonly value: ProviderIdValue) {}

	static reddit(): ProviderId {
		return new ProviderId("reddit");
	}

	static wikipedia(): ProviderId {
		return new ProviderId("wikipedia");
	}

	static geekfeminism(): ProviderId {
		return new ProviderId("geekfeminism");
	}

	static generic(): ProviderId {
		return new ProviderId("generic");
	}

	toJSON(): ProviderIdValue {
		return this.value;
	}
}
