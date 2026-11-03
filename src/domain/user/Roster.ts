import { LastAdminError } from "./LastAdminError.ts";
import { NoUser } from "./NoUser.ts";
import type { RegisteredUser } from "./RegisteredUser.ts";
import type { Role } from "./Role.ts";
import { UnknownUserError } from "./UnknownUserError.ts";
import type { User } from "./User.ts";
import type { Username } from "./Username.ts";
import { UsernameTakenError } from "./UsernameTakenError.ts";

export class Roster {
	constructor(private readonly users: RegisteredUser[]) {}

	list(): RegisteredUser[] {
		return [...this.users];
	}

	find(name: Username): User {
		const match = this.users.find((user) => user.isNamed(name));
		let found: User = new NoUser();
		if (match !== undefined) {
			found = match;
		}
		return found;
	}

	with(joining: RegisteredUser): Roster {
		const isTaken = this.users.some((user) => user.sharesNameWith(joining));
		if (isTaken) throw new UsernameTakenError();
		return new Roster([...this.users, joining]);
	}

	withRole(name: Username, role: Role): Roster {
		const target = this.users.find((user) => user.isNamed(name));
		if (target === undefined) throw new UnknownUserError();
		const others = this.users.filter((user) => user !== target);
		const otherAdminRemains = others.some((user) => user.isAdmin());
		const wouldLeaveNoAdmin =
			target.isAdmin() && !role.isAdmin() && !otherAdminRemains;
		if (wouldLeaveNoAdmin) throw new LastAdminError();
		const changed: RegisteredUser[] = [];
		for (const user of this.users) {
			let next = user;
			if (user === target) {
				next = user.withRole(role);
			}
			changed.push(next);
		}
		return new Roster(changed);
	}
}
