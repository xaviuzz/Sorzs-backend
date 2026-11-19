import { DomainQualificationStrategy } from "../../domain/search/DomainQualificationStrategy.ts";
import { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { WikipediaQualificationStrategy } from "../../domain/search/WikipediaQualificationStrategy.ts";
import { GeekFeminismSearchProvider } from "../../infrastructure/geekfeminism/GeekFeminismSearchProvider.ts";
import { GenericSearchProvider } from "../../infrastructure/google/GenericSearchProvider.ts";
import type { WebFetch } from "../../infrastructure/http/WebFetch.ts";
import { RedditSearchProvider } from "../../infrastructure/reddit/RedditSearchProvider.ts";
import { SystemClock } from "../../infrastructure/wikipedia/SystemClock.ts";
import { WikipediaSearchProvider } from "../../infrastructure/wikipedia/WikipediaSearchProvider.ts";

const WEB_FETCH: WebFetch = (url, init) => fetch(url, init);

export class SearchProvidersFactory {
	constructor(
		private readonly contact: string,
		private readonly webFetch: WebFetch = WEB_FETCH,
	) {}

	build(): SearchProviders {
		const specialists = [
			new RedditSearchProvider(new DomainQualificationStrategy("reddit.com")),
			new WikipediaSearchProvider(
				new WikipediaQualificationStrategy(),
				this.webFetch,
				this.contact,
				new SystemClock(),
			),
			new GeekFeminismSearchProvider(
				new DomainQualificationStrategy("geekfeminism.fandom.com"),
				this.webFetch,
				this.contact,
			),
		];
		const catchAll = new GenericSearchProvider();
		return new SearchProviders(specialists, catchAll);
	}
}
