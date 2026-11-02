export class Password {
	private constructor(private readonly hash: string) {}

	static hashing(plain: string): Password {
		return new Password(Bun.password.hashSync(plain));
	}

	matches(plain: string): Promise<boolean> {
		return Bun.password.verify(plain, this.hash);
	}
}
