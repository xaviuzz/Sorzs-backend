import { MissingSettingError } from "./MissingSettingError.ts";

export type EnvironmentVariables = Record<string, string | undefined>;

export class Environment {
	constructor(private readonly variables: EnvironmentVariables) {}

	require(setting: string): string {
		const value = this.variables[setting];
		if (value === undefined || value === "")
			throw new MissingSettingError(setting);
		return value;
	}
}
