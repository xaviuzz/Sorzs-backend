import { FaviconAddress } from "../../domain/source/FaviconAddress.ts";
import type { WebAddress } from "../../domain/source/WebAddress.ts";

export class HtmlHead {
	private constructor(
		private readonly title: string,
		private readonly iconReference: string,
	) {}

	static async parse(html: string): Promise<HtmlHead> {
		let title = "";
		let isTitleRead = false;
		let iconReference = "";
		const rewriter = new HTMLRewriter()
			.on("title", {
				text(chunk) {
					if (!isTitleRead) title += chunk.text;
					if (chunk.lastInTextNode) isTitleRead = true;
				},
			})
			.on("link", {
				element(link) {
					const relation = link.getAttribute("rel") ?? "";
					const words = relation.toLowerCase().split(/\s+/);
					const isIcon = words.includes("icon");
					const isFirstIcon = iconReference === "";
					if (isIcon && isFirstIcon)
						iconReference = link.getAttribute("href") ?? "";
				},
			});
		await rewriter.transform(new Response(html)).text();
		return new HtmlHead(title, iconReference);
	}

	pageTitle(): string {
		return this.title;
	}

	declaresIcon(): boolean {
		return this.iconReference !== "";
	}

	declaredIcon(page: WebAddress): FaviconAddress {
		let icon = FaviconAddress.none();
		if (this.declaresIcon())
			icon = FaviconAddress.of(page.resolve(this.iconReference));
		return icon;
	}
}
