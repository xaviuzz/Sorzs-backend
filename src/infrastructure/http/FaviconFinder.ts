import { FaviconAddress } from "../../domain/source/FaviconAddress.ts";
import type { WebAddress } from "../../domain/source/WebAddress.ts";
import type { HtmlHead } from "./HtmlHead.ts";
import type { RedirectFollower } from "./RedirectFollower.ts";

export class FaviconFinder {
	constructor(private readonly redirects: RedirectFollower) {}

	async find(
		head: HtmlHead,
		page: WebAddress,
		signal: AbortSignal,
	): Promise<FaviconAddress> {
		let favicon = head.declaredIcon(page);
		if (!head.declaresIcon()) favicon = await this.findAtRoot(page, signal);
		return favicon;
	}

	private async findAtRoot(
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
		const arrival = await this.redirects.arriveAt(address, signal);
		if (arrival) await arrival.cancelBody();
		const answers = arrival !== null;
		return answers;
	}
}
