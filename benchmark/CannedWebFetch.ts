import type { WebFetch } from "../src/infrastructure/http/WebFetch.ts";
import type { Latency } from "./Latency.ts";

export class CannedWebFetch {
	constructor(private readonly latency: Latency) {}

	asWebFetch(): WebFetch {
		return (url) => this.answer(url);
	}

	private async answer(url: string): Promise<Response> {
		await this.latency.pass();
		const hostname = new URL(url).hostname;
		let reply = this.mediaWiki();
		if (hostname.endsWith("wikipedia.org")) reply = this.wikipedia();
		return reply;
	}

	private wikipedia(): Response {
		const page = {
			title: "Ciberpunk",
			key: "Ciberpunk",
			description: "Subgenre of science fiction",
			excerpt: 'A <span class="searchmatch">cyberpunk</span> story',
		};
		return Response.json({ pages: [page] });
	}

	private mediaWiki(): Response {
		const page = { title: "Solar cooker", snippet: "A solar cooker" };
		return Response.json({ query: { search: [page] } });
	}
}
