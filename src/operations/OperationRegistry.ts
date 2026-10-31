import { InMemorySourceListRepository } from "../infrastructure/InMemorySourceListRepository.ts";
import type { Routes } from "../Routes.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { JsonOperation } from "./JsonOperation.ts";
import type { Operation } from "./Operation.ts";
import { AddSource } from "./sources/AddSource.ts";
import { ListSources } from "./sources/ListSources.ts";

export class OperationRegistry {
	private readonly operationsByName = new Map<string, Operation>();

	constructor(operations: Operation[]) {
		for (const operation of operations) {
			this.operationsByName.set(operation.name, operation);
		}
	}

	static standard(): OperationRegistry {
		const repository = new InMemorySourceListRepository();
		return new OperationRegistry([
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AddSource(repository)),
			new JsonOperation(new ListSources(repository)),
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
