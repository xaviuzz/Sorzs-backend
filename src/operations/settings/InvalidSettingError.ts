export class InvalidSettingError extends Error {
	constructor(setting: string, expected: string) {
		super(`${setting} must be ${expected}`);
	}
}
