import { GoogleLinkSearch } from "../infrastructure/google/GoogleLinkSearch.ts";
import { HttpPageReader } from "../infrastructure/http/HttpPageReader.ts";
import { SqliteSorzListRepository } from "../infrastructure/sqlite/SqliteSorzListRepository.ts";
import type { Routes } from "../Routes.ts";
import { AdminAccess } from "./auth/AdminAccess.ts";
import { AnyUserAccess } from "./auth/AnyUserAccess.ts";
import { AuthLogin } from "./auth/AuthLogin.ts";
import type { AuthSettings } from "./auth/AuthSettings.ts";
import { ProtectedOperation } from "./auth/ProtectedOperation.ts";
import { HealthCheck } from "./health/HealthCheck.ts";
import { JsonOperation } from "./JsonOperation.ts";
import type { Operation } from "./Operation.ts";
import type { OwnedHandler } from "./OwnedHandler.ts";
import { AddSorz } from "./sorzs/AddSorz.ts";
import { Census } from "./sorzs/Census.ts";
import { InspectSorz } from "./sorzs/InspectSorz.ts";
import { ListSorzs } from "./sorzs/ListSorzs.ts";
import { SearchSorzs } from "./sorzs/SearchSorzs.ts";
import { AddUser } from "./users/AddUser.ts";
import { ListUsers } from "./users/ListUsers.ts";
import { SetRole } from "./users/SetRole.ts";

export class OperationRegistry {
	private readonly operationsByName = new Map<string, Operation>();

	constructor(operations: Operation[]) {
		for (const operation of operations) {
			this.operationsByName.set(operation.name, operation);
		}
	}

	static standard(dataDir: string, auth: AuthSettings): OperationRegistry {
		const repository = SqliteSorzListRepository.inFolder(dataDir);
		const reader = new HttpPageReader();
		const signer = auth.signer();
		const users = auth.users(dataDir);
		const protectedBy = (handler: OwnedHandler) =>
			new ProtectedOperation(handler, signer, new AnyUserAccess());
		const protectedForAdmin = (handler: OwnedHandler) =>
			new ProtectedOperation(handler, signer, new AdminAccess(users));
		return new OperationRegistry([
			new JsonOperation(new HealthCheck()),
			new JsonOperation(new AuthLogin(users, signer)),
			protectedBy(new AddSorz(repository, reader)),
			protectedBy(new InspectSorz(reader)),
			protectedBy(new ListSorzs(repository)),
			protectedBy(new SearchSorzs(repository, new GoogleLinkSearch())),
			protectedForAdmin(new ListUsers(users)),
			protectedForAdmin(new AddUser(users)),
			protectedForAdmin(new SetRole(users)),
			protectedForAdmin(new Census(repository)),
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
