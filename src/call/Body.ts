import { InvalidBodyError } from "./InvalidBodyError.ts";
import { InvalidCallError } from "./InvalidCallError.ts";

type Fields = Record<string, unknown>;

export class Body {
	private constructor(private readonly fields: Fields) {}

	static empty(): Body {
		return new Body({});
	}

	static from(raw: unknown): Body {
		Body.requireObject(raw);
		return new Body(raw as Fields);
	}

	requireText(field: string): string {
		const value = this.fields[field];
		if (typeof value !== "string")
			throw new InvalidBodyError(`${field} is required`);
		return value;
	}

	optionalText(field: string): string {
		const isLeftOut = !(field in this.fields);
		if (isLeftOut) return "";
		return this.requireText(field);
	}

	private static requireObject(raw: unknown): void {
		const isObject = typeof raw === "object" && raw !== null;
		if (!isObject) throw new InvalidCallError("body must be an object");
	}
}
