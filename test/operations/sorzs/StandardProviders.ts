import type { SearchProviders } from "../../../src/domain/search/SearchProviders.ts";
import { SearchProvidersFactory } from "../../../src/operations/sorzs/SearchProvidersFactory.ts";

export function standardProviders(): SearchProviders {
	return new SearchProvidersFactory("contact@example.org").build();
}
