import type { SorzEntry } from "../../domain/sorz-list/SorzEntry.ts";
import { SorzList } from "../../domain/sorz-list/SorzList.ts";
import type { SorzListRepository } from "../../domain/sorz-list/SorzListRepository.ts";
import type { Username } from "../../domain/user/Username.ts";

export class InMemorySorzListRepository implements SorzListRepository {
	private readonly heldByOwner = new Map<string, SorzEntry[]>();

	async load(owner: Username): Promise<SorzList> {
		const list = new SorzList(this.heldBy(owner));
		return list;
	}

	async loadEveryList(): Promise<SorzList[]> {
		const lists: SorzList[] = [];
		for (const held of this.heldByOwner.values()) {
			lists.push(new SorzList(held));
		}
		return lists;
	}

	async add(owner: Username, entry: SorzEntry): Promise<void> {
		const held = this.heldBy(owner);
		held.push(entry);
		this.heldByOwner.set(owner.toString(), held);
	}

	private heldBy(owner: Username): SorzEntry[] {
		return this.heldByOwner.get(owner.toString()) ?? [];
	}
}
