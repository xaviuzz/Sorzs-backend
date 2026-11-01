import { FaviconAddress } from "./FaviconAddress.ts";
import { PageTitle } from "./PageTitle.ts";
import type { SourceAddress } from "./SourceAddress.ts";

export class PageInfo {
	constructor(
		private readonly title: PageTitle,
		private readonly favicon: FaviconAddress,
	) {}

	static none(): PageInfo {
		return new PageInfo(PageTitle.none(), FaviconAddress.none());
	}

	hasTitle(): boolean {
		return this.title.isPresent();
	}

	toCandidateJSON(address: SourceAddress): {
		address: string;
		title: string | null;
		favicon: string | null;
	} {
		const { title, favicon } = this.toJSON();
		return { address: address.toString(), title, favicon };
	}

	toJSON(): { title: string | null; favicon: string | null } {
		const title = this.title.toJSON();
		const favicon = this.favicon.toJSON();
		return { title, favicon };
	}
}
