export class SourceId {
	private constructor(private readonly value: string) {}

	static generate(): SourceId {
		return new SourceId(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}
}
