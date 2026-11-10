export class SorzId {
	private constructor(private readonly value: string) {}

	static from(value: string): SorzId {
		return new SorzId(value);
	}

	static generate(): SorzId {
		return new SorzId(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}
}
