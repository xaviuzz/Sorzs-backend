import type { SearchProviders } from "../../domain/search/SearchProviders.ts";
import {
	Environment,
	type EnvironmentVariables,
} from "../settings/Environment.ts";
import { SearchProvidersFactory } from "./SearchProvidersFactory.ts";

export class SearchSettings {
	private constructor(private readonly contact: string) {}

	static fromEnv(variables: EnvironmentVariables): SearchSettings {
		const environment = new Environment(variables);
		const contact = environment.require("WIKIPEDIA_CONTACT");
		return new SearchSettings(contact);
	}

	providers(): SearchProviders {
		return new SearchProvidersFactory(this.contact).build();
	}
}
