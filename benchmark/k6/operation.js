import { check, sleep } from "k6";
import {
	ADMIN_OPERATIONS,
	isOk,
	loggedInUsers,
	PROFILES,
	Session,
	summaryTo,
	thresholdsFor,
} from "./common.js";

const OPERATION = __ENV.OPERATION;
const PROFILE = __ENV.PROFILE || "medium";
const profile = PROFILES[PROFILE];

export const options = {
	setupTimeout: "10m",
	scenarios: profile.scenarios,
	thresholds: thresholdsFor(profile, [OPERATION]),
	summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const needsTokens = !["auth.login", "health.check"].includes(OPERATION);

export function setup() {
	return loggedInUsers(profile, needsTokens);
}

function callOperation(session) {
	if (OPERATION === "auth.login") return session.logIn();
	if (OPERATION === "health.check") return session.callWithoutToken(OPERATION);
	return session.call(OPERATION);
}

export default function (data) {
	const session = new Session(ADMIN_OPERATIONS.includes(OPERATION), data);
	check(callOperation(session), { "reply ok": isOk });
	if (profile.pause > 0) sleep(profile.pause);
}

export function handleSummary(data) {
	return summaryTo(OPERATION, PROFILE, data);
}
