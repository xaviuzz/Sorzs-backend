import { check, sleep } from "k6";
import http from "k6/http";
import {
	ADMIN_OPERATIONS,
	BASE_URL,
	isOk,
	loggedInUsers,
	PROFILES,
	Session,
	summaryTo,
	thresholdsFor,
} from "./common.js";

// One operation under load, plus a light health.check probe on the side.
// The probe answers fast while the operation only uses CPU, and slow once the operation holds the thread.
const OPERATION = __ENV.OPERATION;
const PROFILE = __ENV.PROFILE || "medium";
const profile = PROFILES[PROFILE];

export const options = {
	setupTimeout: "10m",
	scenarios: {
		...profile.scenarios,
		probe: {
			executor: "constant-arrival-rate",
			rate: 10,
			timeUnit: "1s",
			duration: "2m",
			preAllocatedVUs: 5,
			maxVUs: 20,
			exec: "probe",
		},
	},
	thresholds: thresholdsFor(profile, [OPERATION, "probe.health"]),
	summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
	return loggedInUsers(profile, OPERATION !== "auth.login");
}

export default function (data) {
	const session = new Session(ADMIN_OPERATIONS.includes(OPERATION), data);
	const reply =
		OPERATION === "auth.login" ? session.logIn() : session.call(OPERATION);
	check(reply, { "reply ok": isOk });
	if (profile.pause > 0) sleep(profile.pause);
}

export function probe() {
	const reply = http.post(
		`${BASE_URL}/health.check`,
		JSON.stringify({ header: { callId: "probe" } }),
		{ tags: { operation: "probe.health" } },
	);
	check(reply, { "probe ok": isOk });
}

export function handleSummary(data) {
	return summaryTo(`${OPERATION}-probe`, PROFILE, data);
}
