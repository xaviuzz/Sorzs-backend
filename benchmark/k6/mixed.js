import { check, sleep } from "k6";
import {
	isOk,
	loggedInUsers,
	PROFILES,
	Session,
	summaryTo,
	thresholdsFor,
} from "./common.js";

const PROFILE = __ENV.PROFILE || "medium";
const profile = PROFILES[PROFILE];

// Weights in percent. They are an assumption: Sorzs has no real traffic to measure.
const MIX = [
	["sorzs.search", 50],
	["sorzs.list", 25],
	["sorzs.add", 10],
	["sorzs.inspect", 5],
	["auth.login", 1],
	["health.check", 3],
	["users.list", 3.8],
	["users.add", 1],
	["users.setRole", 1],
	["sorzs.census", 0.2],
];
const ADMIN = ["users.list", "users.add", "users.setRole", "sorzs.census"];

export const options = {
	setupTimeout: "10m",
	scenarios: profile.scenarios,
	thresholds: thresholdsFor(
		profile,
		MIX.map(([operation]) => operation),
	),
	summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
	return loggedInUsers(profile, true);
}

function pick() {
	let point = Math.random() * 100;
	for (const [operation, weight] of MIX) {
		point -= weight;
		if (point < 0) return operation;
	}
	return MIX[0][0];
}

function callOperation(operation, data) {
	const user = new Session(false, data);
	if (operation === "auth.login") return user.logIn();
	if (operation === "health.check") return user.callWithoutToken(operation);
	if (ADMIN.includes(operation)) return new Session(true, data).call(operation);
	return user.call(operation);
}

export default function (data) {
	check(callOperation(pick(), data), { "reply ok": isOk });
	if (profile.pause > 0) sleep(profile.pause);
}

export function handleSummary(data) {
	return summaryTo("mixed", PROFILE, data);
}
