import { expect, test } from "bun:test";
import { MissingSettingError } from "../../../src/operations/settings/MissingSettingError.ts";
import { SearchSettings } from "../../../src/operations/sorzs/SearchSettings.ts";
import { serverEnvironment } from "../../ServerEnvironment.ts";

test("builds the search providers when the contact is given", () => {
	const settings = SearchSettings.fromEnv(serverEnvironment());

	const providers = settings.providers();

	expect(providers).toBeDefined();
});

test("refuses to start without the Wikipedia contact", () => {
	const environment = { ...serverEnvironment(), WIKIPEDIA_CONTACT: undefined };

	expect(() => SearchSettings.fromEnv(environment)).toThrow(
		new MissingSettingError("WIKIPEDIA_CONTACT"),
	);
});

test("refuses to start with an empty Wikipedia contact", () => {
	const environment = { ...serverEnvironment(), WIKIPEDIA_CONTACT: "" };

	expect(() => SearchSettings.fromEnv(environment)).toThrow(
		new MissingSettingError("WIKIPEDIA_CONTACT"),
	);
});
