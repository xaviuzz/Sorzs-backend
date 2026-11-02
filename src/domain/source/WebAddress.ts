const WEB_PROTOCOLS = ["http:", "https:"];

export class WebAddress {
	constructor(private readonly text: string) {}

	isValid(): boolean {
		if (!URL.canParse(this.text)) return false;
		const protocol = new URL(this.text).protocol;
		const isValid = WEB_PROTOCOLS.includes(protocol);
		return isValid;
	}

	prefixes(): WebAddress[] {
		const url = new URL(this.text);
		const segments = url.pathname.split("/").filter((segment) => segment);
		const prefixes = [new WebAddress(url.origin)];
		let path = "";
		for (const segment of segments) {
			path = `${path}/${segment}`;
			prefixes.push(new WebAddress(`${url.origin}${path}`));
		}
		return prefixes;
	}

	site(): string {
		const { host, pathname } = new URL(this.text);
		const path = pathname.replace(/\/$/, "");
		const site = `${host}${path}`;
		return site;
	}

	equalsIgnoringFinalSlash(other: WebAddress): boolean {
		const mine = this.withoutFinalSlash();
		const theirs = other.withoutFinalSlash();
		const isEqual = mine === theirs;
		return isEqual;
	}

	resolve(reference: string): WebAddress {
		let resolved = new WebAddress("");
		if (URL.canParse(reference, this.text))
			resolved = new WebAddress(new URL(reference, this.text).toString());
		return resolved;
	}

	toString(): string {
		return this.text;
	}

	private withoutFinalSlash(): string {
		return this.text.replace(/\/$/, "");
	}
}
