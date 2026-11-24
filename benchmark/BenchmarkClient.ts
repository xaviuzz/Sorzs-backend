export class BenchmarkClient {
	private token = "";

	constructor(private readonly baseUrl: string) {}

	async logIn(username: string, password: string): Promise<void> {
		const body = await this.call("auth.login", { username, password });
		this.token = (body as { token: string }).token;
	}

	async addUser(username: string, password: string): Promise<void> {
		await this.call("users.add", { username, password, role: "user" });
	}

	async addSorz(address: string): Promise<void> {
		await this.call("sorzs.add", { address, name: "" });
	}

	private async call(path: string, body: object): Promise<unknown> {
		const payload = JSON.stringify({ header: { callId: "prepare" }, body });
		const response = await fetch(`${this.baseUrl}/${path}`, {
			method: "POST",
			headers: { authorization: `Bearer ${this.token}` },
			body: payload,
		});
		const reply = (await response.json()) as {
			header: { status: string };
			body: unknown;
		};
		if (reply.header.status !== "ok")
			throw new Error(`${path} failed: ${JSON.stringify(reply)}`);
		return reply.body;
	}
}
