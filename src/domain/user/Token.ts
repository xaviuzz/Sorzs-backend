export class Token {
	private constructor(private readonly text: string) {}

	static of(text: string): Token {
		return new Token(text);
	}

	toString(): string {
		return this.text;
	}
}
