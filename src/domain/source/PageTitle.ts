const LONGEST_TITLE = 200;

export class PageTitle {
	private constructor(private readonly text: string) {}

	static from(raw: string): PageTitle {
		const trimmed = raw.trim();
		const bounded = trimmed.slice(0, LONGEST_TITLE);
		return new PageTitle(bounded);
	}

	static fromJSON(json: string | null): PageTitle {
		let title = PageTitle.none();
		if (json !== null) title = PageTitle.from(json);
		return title;
	}

	static none(): PageTitle {
		return new PageTitle("");
	}

	isPresent(): boolean {
		const isPresent = this.text.length > 0;
		return isPresent;
	}

	orElse(fallback: string): string {
		let text = fallback;
		if (this.isPresent()) text = this.text;
		return text;
	}

	toJSON(): string | null {
		let json: string | null = null;
		if (this.text.length > 0) json = this.text;
		return json;
	}
}
