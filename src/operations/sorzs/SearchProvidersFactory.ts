import { DomainQualificationStrategy } from "../../domain/search/DomainQualificationStrategy.ts";
import { SearchProviders } from "../../domain/search/SearchProviders.ts";
import { GoogleSearchProvider } from "../../infrastructure/google/GoogleSearchProvider.ts";
import { RedditSearchProvider } from "../../infrastructure/reddit/RedditSearchProvider.ts";

export class SearchProvidersFactory {
	build(): SearchProviders {
		const specialists = [
			new RedditSearchProvider(new DomainQualificationStrategy("reddit.com")),
		];
		const catchAll = new GoogleSearchProvider();
		return new SearchProviders(specialists, catchAll);
	}
}
