export class Username {
	private constructor(private readonly text: string) {}

	static from(text: string): Username {
		return new Username(text);
	}

	equals(other: Username): boolean {
		return this.text === other.text;
	}

	toString(): string {
		return this.text;
	}
}
