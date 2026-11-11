export class ProviderId {
	private constructor(private readonly value: "reddit" | "generic") {}

	static reddit(): ProviderId {
		return new ProviderId("reddit");
	}

	static generic(): ProviderId {
		return new ProviderId("generic");
	}

	toJSON(): "reddit" | "generic" {
		return this.value;
	}
}
