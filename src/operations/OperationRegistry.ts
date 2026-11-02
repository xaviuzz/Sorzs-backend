import { GoogleLinkSearch } from "../infrastructure/google/GoogleLinkSearch.ts";
import { HttpPageReader } from "../infrastructure/http/HttpPageReader.ts";
import { SqliteSourceListRepository } from "../infrastructure/sqlite/SqliteSourceListRepository.ts";
import type { Routes } from "../Routes.ts";
import { AuthLogin } from "./auth/AuthLogin.ts";
import type { AuthSettings } from "./auth/AuthSettings.ts";
import { ProtectedOperation } from "./auth/ProtectedOperation.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { JsonOperation } from "./JsonOperation.ts";
import type { Operation } from "./Operation.ts";
import type { OwnedHandler } from "./OwnedHandler.ts";
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

	static standard(dataDir: string, auth: AuthSettings): OperationRegistry {
		const repository = SqliteSourceListRepository.inFolder(dataDir);
		const reader = new HttpPageReader();
		const signer = auth.signer();
		const protectedBy = (handler: OwnedHandler) =>
			new ProtectedOperation(handler, signer);
		return new OperationRegistry([
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AuthLogin(auth.users(), signer)),
			protectedBy(new AddSource(repository, reader)),
			protectedBy(new InspectSource(reader)),
			protectedBy(new ListSources(repository)),
			protectedBy(new SearchSources(repository, new GoogleLinkSearch())),
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
