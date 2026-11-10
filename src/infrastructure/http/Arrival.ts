import type { WebAddress } from "../../domain/sorz/WebAddress.ts";

const LARGEST_PAGE_BYTES = 1024 * 1024;

export class Arrival {
	constructor(
		private readonly response: Response,
		private readonly page: WebAddress,
	) {}

	address(): WebAddress {
		return this.page;
	}

	isHtml(): boolean {
		const type = this.response.headers.get("content-type") ?? "";
		const isHtml = type.includes("text/html");
		const isXhtml = type.includes("application/xhtml+xml");
		return isHtml || isXhtml;
	}

	async readFirstMegabyte(): Promise<string> {
		const chunks: BlobPart[] = [];
		let total = 0;
		const reader = this.response.body?.getReader();
		while (reader && total < LARGEST_PAGE_BYTES) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			total += value.length;
		}
		await reader?.cancel();
		const bytes = new Blob(chunks).slice(0, LARGEST_PAGE_BYTES);
		return bytes.text();
	}

	async cancelBody(): Promise<void> {
		await this.response.body?.cancel();
	}
}
