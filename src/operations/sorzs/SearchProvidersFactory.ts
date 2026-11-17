import { DomainQualificationStrategy } from "../../domain/search/DomainQualificationStrategy.ts";
import { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { WikipediaQualificationStrategy } from "../../domain/search/WikipediaQualificationStrategy.ts";
import { GenericSearchProvider } from "../../infrastructure/google/GenericSearchProvider.ts";
import { RedditSearchProvider } from "../../infrastructure/reddit/RedditSearchProvider.ts";
import { SystemClock } from "../../infrastructure/wikipedia/SystemClock.ts";
import {
	type WikipediaFetch,
	WikipediaSearchProvider,
} from "../../infrastructure/wikipedia/WikipediaSearchProvider.ts";

const WEB_FETCH: WikipediaFetch = (url, init) => fetch(url, init);

export class SearchProvidersFactory {
	constructor(
		private readonly wikipediaContact: string,
		private readonly wikipediaFetch: WikipediaFetch = WEB_FETCH,
	) {}

	build(): SearchProviders {
		const specialists = [
			new RedditSearchProvider(new DomainQualificationStrategy("reddit.com")),
			new WikipediaSearchProvider(
				new WikipediaQualificationStrategy(),
				this.wikipediaFetch,
				this.wikipediaContact,
				new SystemClock(),
			),
		];
		const catchAll = new GenericSearchProvider();
		return new SearchProviders(specialists, catchAll);
	}
}
