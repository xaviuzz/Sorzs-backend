export class ForbiddenCall {
	toResponse(): Response {
		const body = { code: "FORBIDDEN", message: "forbidden" };
		return Response.json(body, { status: 403 });
	}
}
