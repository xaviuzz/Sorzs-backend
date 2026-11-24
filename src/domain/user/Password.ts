export class Password {
	private constructor(private readonly hash: string) {}

	static hashing(plain: string): Password {
		return new Password(Bun.password.hashSync(plain));
	}

	static async hashed(plain: string): Promise<Password> {
		return new Password(await Bun.password.hash(plain));
	}

	static fromHash(hash: string): Password {
		return new Password(hash);
	}

	matches(plain: string): Promise<boolean> {
		return Bun.password.verify(plain, this.hash);
	}

	toString(): string {
		return this.hash;
	}
}
