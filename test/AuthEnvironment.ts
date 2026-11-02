export function authEnvironment(): Record<string, string | undefined> {
	return {
		AUTH_SECRET: "test-secret",
		SEED_USERS: "xaviuzz:p1casso:admin,ana:pueblos",
	};
}
