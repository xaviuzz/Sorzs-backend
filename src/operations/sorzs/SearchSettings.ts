import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import type { WebFetch } from "../../infrastructure/http/WebFetch.ts";
import {
	Environment,
	type EnvironmentVariables,
} from "../settings/Environment.ts";
import { SearchProvidersFactory } from "./SearchProvidersFactory.ts";

export class SearchSettings {
	private constructor(
		private readonly contact: string,
		private readonly webFetch?: WebFetch,
	) {}

	static fromEnv(
		variables: EnvironmentVariables,
		webFetch?: WebFetch,
	): SearchSettings {
		const environment = new Environment(variables);
		const contact = environment.require("WIKIPEDIA_CONTACT");
		return new SearchSettings(contact, webFetch);
	}

	providers(): SearchProviders {
		return new SearchProvidersFactory(this.contact, this.webFetch).build();
	}
}
