import { InvalidQueryError } from "./InvalidQueryError.ts";

const LONGEST_QUERY = 200;

export class SearchQuery {
	private constructor(private readonly text: string) {}

	static from(raw: string): SearchQuery {
		const text = raw.trim();
		SearchQuery.requireValidLength(text);
		return new SearchQuery(text);
	}

	private static requireValidLength(text: string): void {
		const isPresent = text.length > 0;
		const isShortEnough = text.length <= LONGEST_QUERY;
		const isValid = isPresent && isShortEnough;
		if (!isValid)
			throw new InvalidQueryError(
				`query must have between 1 and ${LONGEST_QUERY} characters`,
			);
	}

	toString(): string {
		return this.text;
	}
}
