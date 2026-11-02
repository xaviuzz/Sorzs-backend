import { GoogleLinkSearch } from "../infrastructure/google/GoogleLinkSearch.ts";
import { HttpPageReader } from "../infrastructure/http/HttpPageReader.ts";
import { InMemorySourceListRepository } from "../infrastructure/memory/InMemorySourceListRepository.ts";
import type { Routes } from "../Routes.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { JsonOperation } from "./JsonOperation.ts";
import type { Operation } from "./Operation.ts";
import { AddSource } from "./sources/AddSource.ts";
import { InspectSource } from "./sources/InspectSource.ts";
import { ListSources } from "./sources/ListSources.ts";
import { SearchSources } from "./sources/SearchSources.ts";

export class OperationRegistry {
	private readonly operationsByName = new Map<string, Operation>();

	constructor(operations: Operation[]) {
		for (const operation of operations) {
			this.operationsByName.set(operation.name, operation);
		}
	}

	static standard(): OperationRegistry {
		const repository = new InMemorySourceListRepository();
		const reader = new HttpPageReader();
		return new OperationRegistry([
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AddSource(repository, reader)),
			new JsonOperation(new InspectSource(reader)),
			new JsonOperation(new ListSources(repository)),
			new JsonOperation(new SearchSources(repository, new GoogleLinkSearch())),
		]);
	}

	routes(): Routes {
		const routes: Routes = {};
		for (const operation of this.operationsByName.values()) {
			routes[`/${operation.name}`] = {
				POST: (request) => operation.serve(request),
			};
		}
		return routes;
	}

	names(): string[] {
		return [...this.operationsByName.keys()];
	}
}
