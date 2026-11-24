// Turns the k6 summaries in benchmark/out into Markdown reports in benchmark/results.
// Usage: bun benchmark/report.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "benchmark/out";
const RESULTS = "benchmark/results";
const OPERATIONS = [
	"health.check",
	"auth.login",
	"sorzs.add",
	"sorzs.inspect",
	"sorzs.list",
	"sorzs.search",
	"sorzs.census",
	"users.list",
	"users.add",
	"users.setRole",
];

type Values = Record<string, number>;
type Summary = {
	state: { testRunDurationMs: number };
	metrics: Record<string, { values: Values }>;
};

function summaryOf(name: string, profile: string): Summary | null {
	let summary: Summary | null = null;
	try {
		summary = JSON.parse(
			readFileSync(`${OUT}/${name}-${profile}.json`, "utf8"),
		);
	} catch {
		summary = null;
	}
	return summary;
}

function resourcesOf(name: string, profile: string) {
	const lines = readFileSync(`${OUT}/${name}-${profile}.stats`, "utf8")
		.trim()
		.split("\n");
	const cpu = lines.map((line) => Number.parseFloat(line));
	const memory = lines.map((line) => Number.parseFloat(line.split(" ")[1]));
	const mean = cpu.reduce((sum, value) => sum + value, 0) / cpu.length;
	return {
		average: mean.toFixed(0),
		maximum: Math.max(...cpu).toFixed(0),
		memory: Math.max(...memory).toFixed(0),
	};
}

function loadSeconds(summary: Summary): number {
	const login =
		summary.metrics["http_reqs{operation:setup.login}"]?.values.count ?? 0;
	const average =
		summary.metrics["http_req_duration{operation:setup.login}"]?.values.avg ??
		0;
	return (summary.state.testRunDurationMs - login * average) / 1000;
}

function row(summary: Summary, operation: string): string {
	const count =
		summary.metrics[`http_reqs{operation:${operation}}`]?.values.count ?? 0;
	const time =
		summary.metrics[`http_req_duration{operation:${operation}}`]?.values;
	let line = `| ${operation} | 0 | | | | | |`;
	if (time && count > 0) {
		const rate = (count / loadSeconds(summary)).toFixed(1);
		const cells = [
			count,
			rate,
			time.med,
			time["p(95)"],
			time["p(99)"],
			time.max,
		];
		line = `| ${operation} | ${cells.map((cell) => Number(cell).toFixed(cell === count ? 0 : 1)).join(" | ")} |`;
	}
	return line;
}

function table(summary: Summary, operations: string[]): string {
	const header =
		"| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms |";
	const rule = "|---|---|---|---|---|---|---|";
	return [
		header,
		rule,
		...operations.map((operation) => row(summary, operation)),
	].join("\n");
}

function errorsOf(summary: Summary): string {
	const failed = summary.metrics.checks?.values.fails ?? 0;
	const passed = summary.metrics.checks?.values.passes ?? 0;
	return `${failed} of ${failed + passed} replies were not ok`;
}

function commit(): string {
	const head = readFileSync(".git/HEAD", "utf8").trim();
	const reference = head.replace("ref: ", "");
	const hash = head.startsWith("ref: ")
		? readFileSync(`.git/${reference}`, "utf8").trim()
		: head;
	return hash.slice(0, 7);
}

function header(title: string, profile: string): string {
	const date = new Date().toISOString().slice(0, 10);
	return `# ${title}\n\nDate ${date}, backend commit ${commit()} plus the uncommitted benchmark code, profile ${profile}. Local baseline on one machine: backend in Docker with 2 CPUs, fake providers with 100 ms latency, 1000 users with 20 sorzs each. Not production figures.\n`;
}

function write(file: string, text: string): void {
	mkdirSync(RESULTS, { recursive: true });
	writeFileSync(`${RESULTS}/${file}`, `${text}\n`);
}

const date = new Date().toISOString().slice(0, 10);

function usage(profile: string) {
	return resourcesOf("mixed", profile);
}

const rows: string[] = [];
for (const operation of OPERATIONS) {
	const summary = summaryOf(operation, "medium");
	if (summary) {
		const failed = summary.metrics.checks?.values.fails ?? 0;
		const usage = resourcesOf(operation, "medium");
		rows.push(
			`${row(summary, operation)} ${failed} | ${usage.average} / ${usage.maximum} | ${usage.memory} |`,
		);
	}
}
const isolated = [
	header(
		"Isolated operations",
		"medium (50 virtual users, 1 s pause, 2 minutes)",
	),
	"| Operation | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Replies not ok | CPU avg / max % | Memory max MiB |",
	"|---|---|---|---|---|---|---|---|---|---|",
	...rows,
].join("\n");
write(`${date}-isolated-medium.md`, isolated);

for (const profile of ["medium", "high", "stress"]) {
	const summary = summaryOf("mixed", profile);
	if (summary) {
		const text = [
			header("Mixed scenario", profile),
			table(summary, OPERATIONS),
			"",
			`${errorsOf(summary)}. Container CPU avg ${usage(profile).average} % and max ${usage(profile).maximum} % of 200 %, memory max ${usage(profile).memory} MiB.`,
		].join("\n");
		write(`${date}-mixed-${profile}.md`, text);
	}
}
