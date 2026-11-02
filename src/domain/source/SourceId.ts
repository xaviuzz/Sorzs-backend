export class SourceId {
	private constructor(private readonly value: string) {}

	static from(value: string): SourceId {
		return new SourceId(value);
	}

	static generate(): SourceId {
		return new SourceId(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}
}
