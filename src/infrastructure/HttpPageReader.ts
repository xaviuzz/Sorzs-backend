import { FaviconAddress } from "../domain/source/FaviconAddress.ts";
import { PageInfo } from "../domain/source/PageInfo.ts";
import type { PageReader } from "../domain/source/PageReader.ts";
import { PageTitle } from "../domain/source/PageTitle.ts";
import type { SourceAddress } from "../domain/source/SourceAddress.ts";
import { WebAddress } from "../domain/source/WebAddress.ts";
import { HtmlHead } from "./HtmlHead.ts";

const DEFAULT_TIMEOUT_MS = 3000;
const LARGEST_PAGE_BYTES = 1024 * 1024;
const MOST_REDIRECTS = 3;
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

type Arrival = { response: Response; address: WebAddress };

export class HttpPageReader implements PageReader {
	constructor(private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {}

	async read(address: SourceAddress): Promise<PageInfo> {
		const signal = AbortSignal.timeout(this.timeoutMs);
		let info = PageInfo.none();
		try {
			info = await this.readPage(new WebAddress(address.toString()), signal);
		} catch (_failure) {
			info = PageInfo.none();
		}
		return info;
	}

	private async readPage(
		address: WebAddress,
		signal: AbortSignal,
	): Promise<PageInfo> {
		const arrival = await this.arriveAt(address, signal);
		let info = PageInfo.none();
		if (arrival && this.isHtml(arrival.response)) {
			const html = await this.readFirstMegabyte(arrival.response);
			const head = await HtmlHead.parse(html);
			const favicon = await this.findFavicon(head, arrival.address, signal);
			info = new PageInfo(PageTitle.from(head.pageTitle()), favicon);
		}
		return info;
	}

	private async findFavicon(
		head: HtmlHead,
		page: WebAddress,
		signal: AbortSignal,
	): Promise<FaviconAddress> {
		let favicon = FaviconAddress.none();
		if (head.declaresIcon())
			favicon = FaviconAddress.of(head.iconAddressFrom(page));
		else favicon = await this.findFaviconAtRoot(page, signal);
		return favicon;
	}

	private async findFaviconAtRoot(
		page: WebAddress,
		signal: AbortSignal,
	): Promise<FaviconAddress> {
		const atRoot = page.resolve("/favicon.ico");
		const answers = await this.answers(atRoot, signal);
		let favicon = FaviconAddress.none();
		if (answers) favicon = FaviconAddress.of(atRoot);
		return favicon;
	}

	private async answers(
		address: WebAddress,
		signal: AbortSignal,
	): Promise<boolean> {
		const arrival = await this.arriveAt(address, signal);
		if (arrival) await arrival.response.body?.cancel();
		const answers = arrival !== null;
		return answers;
	}

	private async arriveAt(
		address: WebAddress,
		signal: AbortSignal,
	): Promise<Arrival | null> {
		let current = address;
		let arrival: Arrival | null = null;
		for (let redirects = 0; redirects <= MOST_REDIRECTS; redirects++) {
			const response = await fetch(current.toString(), {
				redirect: "manual",
				signal,
			});
			const isRedirect = REDIRECT_STATUSES.includes(response.status);
			const target = response.headers.get("location") ?? "";
			const next = current.resolve(target);
			const canFollow = isRedirect && next.isValid();
			if (canFollow) {
				await response.body?.cancel();
				current = next;
				continue;
			}
			if (response.ok) arrival = { response, address: current };
			else await response.body?.cancel();
			break;
		}
		return arrival;
	}

	private isHtml(response: Response): boolean {
		const type = response.headers.get("content-type") ?? "";
		const isHtml = type.includes("text/html");
		const isXhtml = type.includes("application/xhtml+xml");
		return isHtml || isXhtml;
	}

	private async readFirstMegabyte(response: Response): Promise<string> {
		const chunks: BlobPart[] = [];
		let total = 0;
		const reader = response.body?.getReader();
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
}
