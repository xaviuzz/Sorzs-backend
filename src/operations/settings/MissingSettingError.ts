export class MissingSettingError extends Error {
	constructor(setting: string) {
		super(`${setting} is required`);
	}
}
