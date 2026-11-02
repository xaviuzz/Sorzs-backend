import type { Token } from "./Token.ts";
import type { Username } from "./Username.ts";

export interface TokenSigner {
	sign(name: Username): Token;
	recognizes(raw: string): boolean;
}
