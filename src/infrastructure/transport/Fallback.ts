export interface Fallback {
	answer(request: Request): Response | Promise<Response>;
}
