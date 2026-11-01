type ResultJson = {
	title: string;
	url: string;
	description: string;
	source: string;
};

export class SearchResult {
	constructor(
		private readonly title: string,
		private readonly url: string,
		private readonly description: string,
		private readonly source: string,
	) {}

	toJSON(): ResultJson {
		const { title, url, description, source } = this;
		return { title, url, description, source };
	}
}
