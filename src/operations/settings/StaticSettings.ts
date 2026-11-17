import type { Fallback } from "../../infrastructure/transport/Fallback.ts";
import { NotFoundFallback } from "../../infrastructure/transport/NotFoundFallback.ts";
import { StaticFilesFallback } from "../../infrastructure/transport/StaticFilesFallback.ts";
import type { EnvironmentVariables } from "./Environment.ts";

type FallbackBuilder = (operationUrls: string[]) => Fallback;

export class StaticSettings {
	private constructor(private readonly builder: FallbackBuilder) {}

	static fromEnv(variables: EnvironmentVariables): StaticSettings {
		const folder = variables.STATIC_DIR;
		let builder: FallbackBuilder = () => new NotFoundFallback();
		if (folder !== undefined && folder !== "")
			builder = (operationUrls) =>
				new StaticFilesFallback(folder, operationUrls);
		return new StaticSettings(builder);
	}

	fallback(operationUrls: string[]): Fallback {
		return this.builder(operationUrls);
	}
}
