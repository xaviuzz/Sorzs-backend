import type { Call } from "../../call/Call.ts";
import { InvalidCredentialsError } from "../../domain/user/InvalidCredentialsError.ts";
import type { TokenSigner } from "../../domain/user/TokenSigner.ts";
import { Username } from "../../domain/user/Username.ts";
import type { Users } from "../../domain/user/Users.ts";
import type { JsonHandler } from "../../infrastructure/transport/JsonTransport.ts";

export class AuthLogin implements JsonHandler {
	readonly name = "auth.login";

	constructor(
		private readonly users: Users,
		private readonly signer: TokenSigner,
	) {}

	async execute(call: Call): Promise<unknown> {
		const name = Username.from(call.body.requireText("username"));
		const password = call.body.requireText("password");
		const user = await this.users.find(name);
		const accepted = await user.accepts(password);
		if (!accepted) throw new InvalidCredentialsError();
		const token = this.signer.sign(name);
		return { token: token.toString() };
	}
}
