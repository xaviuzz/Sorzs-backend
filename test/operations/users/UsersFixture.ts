import { Password } from "../../../src/domain/user/Password.ts";
import { RegisteredUser } from "../../../src/domain/user/RegisteredUser.ts";
import { Role } from "../../../src/domain/user/Role.ts";
import { Username } from "../../../src/domain/user/Username.ts";
import { InMemoryUsers } from "../../../src/infrastructure/memory/InMemoryUsers.ts";
import { JsonOperation } from "../../../src/operations/JsonOperation.ts";
import { OwnedBy } from "../../../src/operations/OwnedBy.ts";
import type { OwnedHandler } from "../../../src/operations/OwnedHandler.ts";

export function seededUsers(): InMemoryUsers {
	return new InMemoryUsers([
		new RegisteredUser(
			Username.from("xaviuzz"),
			Password.hashing("p1casso"),
			Role.admin(),
		),
		new RegisteredUser(Username.from("ana"), Password.hashing("pueblos")),
	]);
}

export class UsersCall {
	private response = new Response();

	constructor(private readonly handler: OwnedHandler) {}

	async send(body?: unknown): Promise<void> {
		const payload = JSON.stringify({ header: { callId: "u-1" }, body });
		const request = new Request(`http://x/${this.handler.name}`, {
			method: "POST",
			body: payload,
		});
		const operation = new JsonOperation(
			new OwnedBy(Username.from("xaviuzz"), this.handler),
		);
		this.response = await operation.serve(request);
	}

	status(): number {
		return this.response.status;
	}

	async body(): Promise<unknown> {
		const reply = (await this.response.clone().json()) as { body: unknown };
		return reply.body;
	}

	async text(): Promise<string> {
		return await this.response.clone().text();
	}
}
