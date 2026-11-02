import { SourceList } from "../../domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";

export class InMemorySourceListRepository implements SourceListRepository {
	private held = new SourceList();

	async load(): Promise<SourceList> {
		return this.held;
	}

	async save(list: SourceList): Promise<void> {
		this.held = list;
	}
}
