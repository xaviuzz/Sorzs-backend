import { InMemorySorzListRepository } from "../../../src/infrastructure/memory/InMemorySorzListRepository.ts";
import { behavesAsSorzListRepository } from "../SorzListRepositoryBehavior.ts";

behavesAsSorzListRepository(() => new InMemorySorzListRepository());
