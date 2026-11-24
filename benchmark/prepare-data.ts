import { BenchmarkClient } from "./BenchmarkClient.ts";

const baseUrl = Bun.env.BENCHMARK_URL ?? "http://localhost:3000";
const users = Number(Bun.env.BENCHMARK_USERS ?? 1000);
const sorzsPerUser = Number(Bun.env.BENCHMARK_SORZS_PER_USER ?? 20);
const parallel = Number(Bun.env.BENCHMARK_PARALLEL ?? 20);
const POOL = 300;
const KNOWN = [
	"https://es.wikipedia.org",
	"https://geekfeminism.fandom.com",
	"https://www.appropedia.org",
	"https://www.reddit.com/r/spain",
	"https://example.com",
];

function usernameOf(index: number): string {
	return `user${String(index).padStart(4, "0")}`;
}

function addressesOf(index: number): string[] {
	const addresses = KNOWN.slice(0, sorzsPerUser);
	for (let i = addresses.length; i < sorzsPerUser; i++) {
		const site = (index * sorzsPerUser + i) % POOL;
		addresses.push(`https://site-${site}.example`);
	}
	return addresses;
}

async function prepare(admin: BenchmarkClient, index: number): Promise<void> {
	const username = usernameOf(index);
	await admin.addUser(username, "bench");
	const client = new BenchmarkClient(baseUrl);
	await client.logIn(username, "bench");
	for (const address of addressesOf(index)) await client.addSorz(address);
}

const admin = new BenchmarkClient(baseUrl);
await admin.logIn("xaviuzz", "p1casso");
let next = 0;
async function worker(): Promise<void> {
	while (next < users) {
		next += 1;
		await prepare(admin, next);
	}
}
await Promise.all(Array.from({ length: parallel }, worker));
console.log(`prepared ${users} users with ${sorzsPerUser} sorzs each`);
