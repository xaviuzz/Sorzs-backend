import { createHmac, timingSafeEqual } from "node:crypto";
import { Token } from "../../domain/user/Token.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { Username } from "../../domain/user/Username.ts";

export class HmacTokenSigner implements TokenSigner {
	constructor(private readonly secret: string) {}

	sign(name: Username): Token {
		const payload = Buffer.from(name.toString()).toString("base64url");
		const signature = this.signatureOf(payload);
		return Token.of(`${payload}.${signature}`);
	}

	recognizes(raw: string): boolean {
		const parts = raw.split(".");
		if (parts.length !== 2) return false;
		const [payload = "", signature = ""] = parts;
		const expected = Buffer.from(this.signatureOf(payload));
		const given = Buffer.from(signature);
		const sameLength = expected.length === given.length;
		return sameLength && timingSafeEqual(expected, given);
	}

	userOf(raw: string): Username {
		const [payload = ""] = raw.split(".");
		const text = Buffer.from(payload, "base64url").toString();
		return Username.from(text);
	}

	private signatureOf(payload: string): string {
		return createHmac("sha256", this.secret)
			.update(payload)
			.digest("base64url");
	}
}
