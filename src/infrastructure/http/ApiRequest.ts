const PAGES_PER_SORZ = 10;
const TIMEOUT_MS = 3000;

export class ApiRequest {
	constructor(private readonly contact: string) {}

	pagesLimit(): number {
		return PAGES_PER_SORZ;
	}

	init(): RequestInit {
		const headers = { "User-Agent": `Sorzs (${this.contact})` };
		const signal = AbortSignal.timeout(TIMEOUT_MS);
		return { headers, signal };
	}
}
