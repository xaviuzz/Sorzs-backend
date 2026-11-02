import { InMemorySourceListRepository } from "../../../src/infrastructure/memory/InMemorySourceListRepository.ts";
import { behavesAsSourceListRepository } from "../SourceListRepositoryBehavior.ts";

behavesAsSourceListRepository(() => new InMemorySourceListRepository());
