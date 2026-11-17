const LANGUAGE_SITE = /^([a-z-]+)(?:\.m)?\.wikipedia\.org$/;
const NOT_A_LANGUAGE = "www";
const NO_LANGUAGE = "";

export class WikipediaSite {
	private readonly languageCode: string;

	constructor(hostname: string) {
		this.languageCode = WikipediaSite.readLanguageCode(hostname);
	}

	isWikipedia(): boolean {
		const hasLanguage = this.languageCode !== NO_LANGUAGE;
		return hasLanguage;
	}

	language(): string {
		return this.languageCode;
	}

	private static readLanguageCode(hostname: string): string {
		const match = LANGUAGE_SITE.exec(hostname);
		let languageCode = NO_LANGUAGE;
		if (match) languageCode = match[1] as string;
		if (languageCode === NOT_A_LANGUAGE) languageCode = NO_LANGUAGE;
		return languageCode;
	}
}
