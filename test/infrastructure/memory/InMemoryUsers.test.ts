import { InMemoryUsers } from "../../../src/infrastructure/memory/InMemoryUsers.ts";
import { behavesAsUsers } from "../UsersBehavior.ts";

behavesAsUsers((registered) => new InMemoryUsers(registered));
