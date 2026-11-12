import type { Database } from "bun:sqlite";

export interface Migration {
	apply(database: Database): void;
}
