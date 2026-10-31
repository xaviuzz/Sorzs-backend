import { FaviconAddress } from "./FaviconAddress.ts";
import { PageTitle } from "./PageTitle.ts";

export class PageInfo {
	constructor(
		private readonly title: PageTitle,
		private readonly favicon: FaviconAddress,
	) {}

	static none(): PageInfo {
		return new PageInfo(PageTitle.none(), FaviconAddress.none());
	}

	toJSON(): { title: string | null; favicon: string | null } {
		const title = this.title.toJSON();
		const favicon = this.favicon.toJSON();
		return { title, favicon };
	}
}
