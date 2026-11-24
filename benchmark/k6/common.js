import http from "k6/http";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const PROFILES = {
	medium: {
		scenarios: { load: { executor: "constant-vus", vus: 50, duration: "2m" } },
		users: 50,
		pause: 1,
	},
	high: {
		scenarios: {
			load: {
				executor: "ramping-vus",
				stages: [
					{ duration: "2m", target: 1000 },
					{ duration: "1m", target: 1000 },
					{ duration: "30s", target: 0 },
				],
			},
		},
		users: 1000,
		pause: 0,
	},
	stress: {
		scenarios: {
			load: {
				executor: "ramping-vus",
				stages: [{ duration: "5m", target: 5000 }],
			},
		},
		thresholds: {
			http_req_duration: [
				{ threshold: "p(95)<1000", abortOnFail: true, delayAbortEval: "30s" },
			],
		},
		users: 1000,
		pause: 0,
	},
};

export const ADMIN_OPERATIONS = [
	"users.list",
	"users.add",
	"users.setRole",
	"sorzs.census",
];

function pad(number) {
	return String(number).padStart(4, "0");
}

export function isOk(response) {
	return response.status === 200 && response.json("header.status") === "ok";
}

export function bodyFor(operation, users) {
	const user = `user${pad(1 + (__VU % users))}`;
	const unique = `${__VU}-${__ITER}`;
	const bodies = {
		"sorzs.add": { address: `https://bench-${unique}.example`, name: "" },
		"sorzs.inspect": { address: `https://bench-${unique}.example` },
		"sorzs.search": { query: "solar" },
		"users.add": {
			username: `bench-${unique}`,
			password: "bench",
			role: "user",
		},
		"users.setRole": { username: user, role: "user" },
	};
	return bodies[operation];
}

// __ITER does not exist in setup.
function iterationOf() {
	return typeof __ITER === "undefined" ? 0 : __ITER;
}

function send(path, body, token, tag = path) {
	const headers = token ? { authorization: `Bearer ${token}` } : {};
	const payload = JSON.stringify({
		header: { callId: `${__VU}-${iterationOf()}` },
		body,
	});
	return http.post(`${BASE_URL}/${path}`, payload, {
		headers,
		tags: { operation: tag },
	});
}

function tokenOf(username, password) {
	const response = send(
		"auth.login",
		{ username, password },
		"",
		"setup.login",
	);
	return response.json("body.token");
}

// Runs once before the load, outside the metrics: every virtual user starts logged in.
export function loggedInUsers(profile, needsTokens) {
	const tokens = [];
	let admin = "";
	if (needsTokens) {
		for (let i = 1; i <= profile.users; i++)
			tokens.push(tokenOf(`user${pad(i)}`, "bench"));
		admin = tokenOf("xaviuzz", "p1casso");
	}
	return { users: profile.users, tokens, admin };
}

export class Session {
	constructor(isAdmin, data) {
		this.isAdmin = isAdmin;
		this.data = data;
	}

	logIn() {
		const index = 1 + (__VU % this.data.users);
		const credentials = this.isAdmin
			? { username: "xaviuzz", password: "p1casso" }
			: { username: `user${pad(index)}`, password: "bench" };
		return send("auth.login", credentials);
	}

	call(operation) {
		const token = this.isAdmin
			? this.data.admin
			: this.data.tokens[__VU % this.data.users];
		return send(operation, bodyFor(operation, this.data.users), token);
	}

	callWithoutToken(operation) {
		return send(operation, undefined);
	}
}

export function thresholdsFor(profile, operations) {
	const thresholds = { ...(profile.thresholds || {}) };
	for (const operation of [...operations, "setup.login"]) {
		thresholds[`http_req_duration{operation:${operation}}`] = ["max>=0"];
		thresholds[`http_reqs{operation:${operation}}`] = ["count>=0"];
	}
	return thresholds;
}

export function summaryTo(name, profileName, data) {
	const file = `${__ENV.OUT_DIR || "benchmark/out"}/${name}-${profileName}.json`;
	return { [file]: JSON.stringify(data, null, 2) };
}
