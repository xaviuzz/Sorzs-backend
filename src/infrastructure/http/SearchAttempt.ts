import { SearchFailedError } from "../../domain/search/SearchFailedError.ts";

export class SearchAttempt {
	async run<T>(read: () => Promise<T>): Promise<T> {
		let outcome: T;
		try {
			outcome = await read();
		} catch (_failure) {
			throw new SearchFailedError();
		}
		return outcome;
	}
}
