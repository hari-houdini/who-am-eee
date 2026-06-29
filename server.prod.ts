import figlet from "figlet";

/**
 * HTTP security headers applied to every response.
 *
 * Shadow DOM removal eliminates all inline `<style>` elements from web
 * components, so no CSP nonce is needed — `style-src 'self'` alone is
 * sufficient and correct.
 *
 * @remarks
 * Duplicated from `index.ts` to keep `server.prod.ts` self-contained.
 */
const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy":
		"default-src 'self'; " +
		"script-src 'self'; " +
		"style-src 'self'; " +
		"font-src 'self' data:; " +
		"img-src 'self' data: blob:; " +
		"connect-src 'self'; " +
		"media-src 'none'; " +
		"object-src 'none'; " +
		"frame-src 'none'; " +
		"worker-src 'self'; " +
		"base-uri 'self'; " +
		"form-action 'self'; " +
		"frame-ancestors 'none'; " +
		"upgrade-insecure-requests",
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy":
		"camera=(), microphone=(), geolocation=(), payment=(), usb=(), " +
		"accelerometer=(), gyroscope=(), magnetometer=()",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Embedder-Policy": "require-corp",
	"Cross-Origin-Resource-Policy": "same-site",
};

/** Path to the pre-built output directory created by `bun run build:prod`. */
const DIST = "./dist";

/**
 * Resolves a URL pathname to a file in `./dist`, preferring a pre-compressed
 * sidecar (`.br` then `.gz`) when the client advertises support.
 *
 * @param pathname - URL pathname (e.g. `/chunks/main-abc.js` or `/`).
 * @param accept   - Value of the `Accept-Encoding` request header.
 * @returns Tuple of [resolved file path, content-encoding or null, content-type].
 */
async function resolveDistFile(
	pathname: string,
	accept: string,
): Promise<[string, string | null, string]> {
	const base = pathname === "/" ? `${DIST}/index.html` : `${DIST}${pathname}`;

	// Derive MIME type from the original extension — not from the sidecar (.br/.gz)
	// extension, which Bun would otherwise infer as application/octet-stream.
	const contentType = Bun.file(base).type;

	if (accept.includes("br")) {
		const br = Bun.file(`${base}.br`);
		if (await br.exists()) return [`${base}.br`, "br", contentType];
	}

	if (accept.includes("gzip")) {
		const gz = Bun.file(`${base}.gz`);
		if (await gz.exists()) return [`${base}.gz`, "gzip", contentType];
	}

	return [base, null, contentType];
}

/**
 * Returns the `Cache-Control` directive for a URL pathname.
 *
 * @param pathname - URL pathname from the incoming request.
 * @returns Cache-Control header value.
 */
function cacheControl(pathname: string): string {
	// index.html must never be cached — its script tags reference content-hashed
	// chunk filenames that change on every deploy.
	if (pathname === "/" || pathname === "/index.html") return "no-cache";

	// Content-hashed chunks, fonts, images, and vendor assets are safe to
	// cache permanently.
	return "public, max-age=31536000, immutable";
}

/**
 * Server-pushed preload hints for the root HTML response.
 *
 * @remarks
 * `nebula.webp` is the LCP element background image. It is referenced via CSS
 * `background-image`, which the HTML parser cannot discover early. The `Link:`
 * header instructs the browser to fetch it immediately alongside the HTML,
 * reducing LCP by 400–800 ms vs. waiting for CSS paint.
 */
const ROOT_LINK_HEADER =
	"</images/nebula.webp>; rel=preload; as=image; fetchpriority=high";

/**
 * Production static file server. Reads pre-built assets from `./dist/`,
 * serves brotli/gzip sidecars when supported, and falls back to
 * `index.html` for unknown paths (SPA-style routing).
 *
 * @remarks
 * Run via `bun run serve:prod` (builds `dist/` first, then starts this server).
 * For development with HMR, use `bun run dev` (`index.ts`) instead.
 */
const server = Bun.serve({
	port: Bun.env.PORT ? Number(Bun.env.PORT) : 3000,

	routes: {
		"/favicon.ico": {
			GET: () => new Response(null, { status: 204, headers: SECURITY_HEADERS }),
		},
		"/figlet": {
			GET: async (req) => {
				const query = new URLSearchParams(req.url.split("?")[1]);
				const text = query.get("text") ?? "Bun!";
				return new Response(figlet.textSync(text), {
					headers: SECURITY_HEADERS,
				});
			},
			POST: async (req) => {
				const body = await req.text();
				return new Response(body, { headers: SECURITY_HEADERS });
			},
		},
	},

	async fetch(req) {
		const url = new URL(req.url);
		const accept = req.headers.get("accept-encoding") ?? "";
		const [filePath, encoding, contentType] = await resolveDistFile(
			url.pathname,
			accept,
		);

		const file = Bun.file(filePath);
		const isRoot = url.pathname === "/" || url.pathname === "/index.html";

		if (!(await file.exists())) {
			// Unknown path — serve index.html so client-side routing can take over.
			const [fallback, fallbackEncoding, fallbackType] =
				await resolveDistFile("/", accept);
			const headers: Record<string, string> = {
				...SECURITY_HEADERS,
				"Cache-Control": "no-cache",
				"Content-Type": fallbackType,
				Vary: "Accept-Encoding",
			};
			if (fallbackEncoding !== null) headers["Content-Encoding"] = fallbackEncoding;
			return new Response(Bun.file(fallback), { headers });
		}

		const headers: Record<string, string> = {
			...SECURITY_HEADERS,
			"Cache-Control": cacheControl(url.pathname),
			"Content-Type": contentType,
			Vary: "Accept-Encoding",
		};
		if (isRoot) headers.Link = ROOT_LINK_HEADER;
		if (encoding !== null) headers["Content-Encoding"] = encoding;
		return new Response(file, { headers });
	},
});

console.log(`Serving dist/ on ${server.url}`);
