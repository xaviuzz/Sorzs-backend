export function serverEnvironment(): Record<string, string | undefined> {
	return {
		AUTH_SECRET: "test-secret",
		SEED_USERS: "xaviuzz:p1casso:admin,ana:pueblos",
		WIKIPEDIA_CONTACT: "contact@example.org",
	};
}
