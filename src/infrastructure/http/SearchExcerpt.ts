import { decode } from "he";

const TAG = /<[^>]*>/g;

export class SearchExcerpt {
	constructor(private readonly html: string) {}

	plainText(): string {
		const withoutTags = this.html.replace(TAG, "");
		const plain = decode(withoutTags);
		return plain;
	}
}
