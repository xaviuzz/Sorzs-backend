export function authEnvironment(): Record<string, string | undefined> {
	return {
		AUTH_SECRET: "test-secret",
		SEED_USER: "xaviuzz",
		SEED_PASSWORD: "p1casso",
	};
}
