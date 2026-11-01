const LONGEST_TITLE = 200;

export class PageTitle {
	private constructor(private readonly text: string) {}

	static from(raw: string): PageTitle {
		const trimmed = raw.trim();
		const bounded = trimmed.slice(0, LONGEST_TITLE);
		return new PageTitle(bounded);
	}

	static none(): PageTitle {
		return new PageTitle("");
	}

	isPresent(): boolean {
		const isPresent = this.text.length > 0;
		return isPresent;
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.text.length > 0) json = this.text;
		return json;
	}
}
