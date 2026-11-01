import { afterEach, beforeEach, expect, test } from "bun:test";
import { SourceAddress } from "../../src/domain/source/SourceAddress.ts";
import { HttpPageReader } from "../../src/infrastructure/HttpPageReader.ts";

let sut: SUT;

beforeEach(() => {
	sut = new SUT();
});

afterEach(() => {
	sut.stop();
});

test("reads the title and the declared icon", async () => {
	sut.html("/", `<title>Example</title><link rel="icon" href="/i.png">`);

	const info = await sut.read("/");

	expect(info).toEqual({ title: "Example", favicon: sut.url("/i.png") });
});

test("removes spaces and line breaks around the title", async () => {
	sut.html("/", "<title>\n  Example  \n</title>");

	const info = await sut.read("/");

	expect(info.title).toBe("Example");
});

test("resolves a relative icon against the page", async () => {
	sut.html("/docs/index.html", `<link rel="icon" href="icon.png">`);

	const info = await sut.read("/docs/index.html");

	expect(info.favicon).toBe(sut.url("/docs/icon.png"));
});

test("accepts a shortcut icon", async () => {
	sut.html("/", `<link rel="shortcut icon" href="/s.ico">`);

	const info = await sut.read("/");

	expect(info.favicon).toBe(sut.url("/s.ico"));
});

test("ignores an apple touch icon", async () => {
	sut.html("/", `<link rel="apple-touch-icon" href="/a.png">`);
	sut.respond("/favicon.ico", () => new Response("icon"));

	const info = await sut.read("/");

	expect(info.favicon).toBe(sut.url("/favicon.ico"));
});

test("falls back to the icon at the root when none is declared", async () => {
	sut.html("/docs/page.html", "<title>Docs</title>");
	sut.respond("/favicon.ico", () => new Response("icon"));

	const info = await sut.read("/docs/page.html");

	expect(info.favicon).toBe(sut.url("/favicon.ico"));
});

test("has no icon when the root has none to offer", async () => {
	sut.html("/", "<title>Example</title>");

	const info = await sut.read("/");

	expect(info).toEqual({ title: "Example", favicon: null });
});

test("drops a declared icon that is not an http address", async () => {
	sut.html("/", `<link rel="icon" href="data:image/png;base64,AAAA">`);
	sut.respond("/favicon.ico", () => new Response("icon"));

	const info = await sut.read("/");

	expect(info.favicon).toBeNull();
});

test("has no title when the page gives none", async () => {
	sut.html("/", `<link rel="icon" href="/i.png">`);

	const info = await sut.read("/");

	expect(info.title).toBeNull();
});

test("follows up to 3 redirects and resolves the icon against the last page", async () => {
	sut.redirect("/a", "/b/one");
	sut.redirect("/b/one", "/b/two");
	sut.redirect("/b/two", "/b/three");
	sut.html("/b/three", `<title>Arrived</title><link rel="icon" href="i.png">`);

	const info = await sut.read("/a");

	expect(info).toEqual({ title: "Arrived", favicon: sut.url("/b/i.png") });
});

test("gives up after 3 redirects", async () => {
	sut.redirect("/a", "/b");
	sut.redirect("/b", "/c");
	sut.redirect("/c", "/d");
	sut.redirect("/d", "/e");
	sut.html("/e", "<title>Too far</title>");

	const info = await sut.read("/a");

	expect(info).toEqual({ title: null, favicon: null });
});

test("ignores a page that is not html", async () => {
	sut.respond(
		"/",
		() =>
			new Response("<title>Text</title>", {
				headers: { "content-type": "text/plain" },
			}),
	);

	const info = await sut.read("/");

	expect(info).toEqual({ title: null, favicon: null });
});

test("ignores a page that answers with an error", async () => {
	sut.respond("/", () => new Response("<title>Gone</title>", { status: 404 }));

	const info = await sut.read("/");

	expect(info).toEqual({ title: null, favicon: null });
});

test("gives up on a page that takes too long", async () => {
	sut.respond("/", async () => {
		await Bun.sleep(500);
		return new Response("<title>Slow</title>", {
			headers: { "content-type": "text/html" },
		});
	});

	const info = await sut.read("/", 100);

	expect(info).toEqual({ title: null, favicon: null });
});

test("reads only the first megabyte", async () => {
	const padding = " ".repeat(1024 * 1024);
	sut.html("/", `${padding}<title>Late</title>`);

	const info = await sut.read("/");

	expect(info.title).toBeNull();
});

test("reads a title that sits within the first megabyte", async () => {
	const padding = " ".repeat(1024 * 1024 - 100);
	sut.html("/", `<title>Early</title>${padding}`);

	const info = await sut.read("/");

	expect(info.title).toBe("Early");
});

test("reads nothing from a site that does not answer", async () => {
	const address = sut.url("/");
	sut.stop();

	const info = await sut.readAddress(address);

	expect(info).toEqual({ title: null, favicon: null });
});

test("parallel reads keep each one's own time limit", async () => {
	sut.respond("/slow", async () => {
		await Bun.sleep(500);
		return new Response("<title>Slow</title>", {
			headers: { "content-type": "text/html" },
		});
	});
	sut.html("/fast", "<title>Fast</title>");

	const [slow, fast] = await sut.readTogether(["/slow", "/fast"], 100);

	expect(slow.title).toBeNull();
	expect(fast.title).toBe("Fast");
});

test("parallel reads keep each one's own redirect and size limits", async () => {
	sut.redirect("/a", "/b");
	sut.redirect("/b", "/c");
	sut.redirect("/c", "/d");
	sut.redirect("/d", "/e");
	sut.html("/e", "<title>Too far</title>");
	sut.html("/big", `${" ".repeat(1024 * 1024)}<title>Late</title>`);
	sut.redirect("/one", "/two");
	sut.html("/two", "<title>Near</title>");

	const [far, big, near] = await sut.readTogether(["/a", "/big", "/one"]);

	expect(far.title).toBeNull();
	expect(big.title).toBeNull();
	expect(near.title).toBe("Near");
});

type Handler = (request: Request) => Response | Promise<Response>;
type Described = { title: string | null; favicon: string | null };

class SUT {
	private readonly handlers = new Map<string, Handler>();
	private readonly server = Bun.serve({
		port: 0,
		fetch: (request) => {
			const path = new URL(request.url).pathname;
			const handler = this.handlers.get(path);
			if (!handler) return new Response("missing", { status: 404 });
			return handler(request);
		},
	});

	html(path: string, content: string): void {
		this.respond(
			path,
			() =>
				new Response(content, {
					headers: { "content-type": "text/html; charset=utf-8" },
				}),
		);
	}

	redirect(from: string, to: string): void {
		this.respond(
			from,
			() => new Response(null, { status: 302, headers: { location: to } }),
		);
	}

	respond(path: string, handler: Handler): void {
		this.handlers.set(path, handler);
	}

	url(path: string): string {
		return new URL(path, this.server.url).toString();
	}

	read(path: string, timeoutMs?: number): Promise<Described> {
		return this.readAddress(this.url(path), timeoutMs);
	}

	async readAddress(address: string, timeoutMs?: number): Promise<Described> {
		const reader = new HttpPageReader(timeoutMs);
		const info = await reader.read(SourceAddress.from(address));
		return info.toJSON();
	}

	readTogether(paths: string[], timeoutMs?: number): Promise<Described[]> {
		const reader = new HttpPageReader(timeoutMs);
		const reads = paths.map(async (path) => {
			const info = await reader.read(SourceAddress.from(this.url(path)));
			return info.toJSON();
		});
		return Promise.all(reads);
	}

	stop(): void {
		this.server.stop(true);
	}
}
