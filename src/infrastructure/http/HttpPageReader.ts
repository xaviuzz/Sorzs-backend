import { PageInfo } from "../../domain/source/PageInfo.ts";
import type { PageReader } from "../../domain/source/PageReader.ts";
import { PageTitle } from "../../domain/source/PageTitle.ts";
import type { SourceAddress } from "../../domain/source/SourceAddress.ts";
import { WebAddress } from "../../domain/source/WebAddress.ts";
import { FaviconFinder } from "./FaviconFinder.ts";
import { HtmlHead } from "./HtmlHead.ts";
import { RedirectFollower } from "./RedirectFollower.ts";

const DEFAULT_TIMEOUT_MS = 3000;

export class HttpPageReader implements PageReader {
	private readonly redirects = new RedirectFollower();
	private readonly favicons = new FaviconFinder(this.redirects);

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
		const arrival = await this.redirects.arriveAt(address, signal);
		let info = PageInfo.none();
		if (arrival?.isHtml()) {
			const html = await arrival.readFirstMegabyte();
			const head = await HtmlHead.parse(html);
			const favicon = await this.favicons.find(head, arrival.address(), signal);
			info = new PageInfo(PageTitle.from(head.pageTitle()), favicon);
		}
		return info;
	}
}
