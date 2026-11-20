import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";

export class ApiReply {
	constructor(private readonly response: Response) {}

	async items<T>(select: (body: never) => unknown): Promise<T[]> {
		this.requireSuccess();
		const body = (await this.response.json()) as never;
		const items = select(body);
		this.requireList(items);
		return items as T[];
	}

	private requireSuccess(): void {
		if (!this.response.ok) throw new SearchFailedError();
	}

	private requireList(items: unknown): void {
		if (!Array.isArray(items)) throw new SearchFailedError();
	}
}
