import type { SourceEntry } from "../../domain/source-list/SourceEntry.ts";
import { SourceList } from "../../domain/source-list/SourceList.ts";
import type { SourceListRepository } from "../../domain/source-list/SourceListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";

export class InMemorySourceListRepository implements SourceListRepository {
	private readonly heldByOwner = new Map<string, SourceEntry[]>();

	async load(owner: Username): Promise<SourceList> {
		const list = new SourceList(this.heldBy(owner));
		return list;
	}

	async add(owner: Username, entry: SourceEntry): Promise<void> {
		const held = this.heldBy(owner);
		held.push(entry);
		this.heldByOwner.set(owner.toString(), held);
	}

	private heldBy(owner: Username): SourceEntry[] {
		return this.heldByOwner.get(owner.toString()) ?? [];
	}
}
