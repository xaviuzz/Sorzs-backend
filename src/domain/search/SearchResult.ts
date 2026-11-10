type ResultJson = {
	title: string;
	url: string;
	description: string;
	sorz: string;
};

export class SearchResult {
	constructor(
		private readonly title: string,
		private readonly url: string,
		private readonly description: string,
		private readonly sorz: string,
	) {}

	toJSON(): ResultJson {
		const { title, url, description, sorz } = this;
		return { title, url, description, sorz };
	}
}
