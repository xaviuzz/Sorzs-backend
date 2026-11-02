import type { SourceEntry } from "../../domain/source-list/SourceEntry.ts";
import { SourceList } from "../../domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";

export class InMemorySourceListRepository implements SourceListRepository {
	private readonly held: SourceEntry[] = [];

	async load(): Promise<SourceList> {
		const list = new SourceList(this.held);
		return list;
	}

	async add(entry: SourceEntry): Promise<void> {
		this.held.push(entry);
	}
}
