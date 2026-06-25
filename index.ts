import figlet from "figlet";
import index from "./index.html";

/**
 * HTTP security headers applied to all non-HTML API and static-asset responses.
 *
 * @remarks
 * Bun's HTML-import routes do not accept custom `Response` wrappers, so the
 * main page (`/`) is served without these headers by the Bun bundler. All API
 * and static-file handlers below apply the full header set.
 */
const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy":
		"default-src 'self'; " +
		"script-src 'self'; " +
		"style-src 'self'; " +
		"font-src 'self'; " +
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

/**
 * Serves a file from the `./public` directory, preferring a pre-compressed
 * sidecar (`.br` then `.gz`) when the client advertises support.
 *
 * @param req - Incoming request whose pathname maps directly to a file
 *   under `./public` (e.g. `/fonts/archivo-black-400.woff2`).
 * @returns File response with long-term cache headers and optional
 *   Content-Encoding, or 404 if the base file does not exist.
 */
async function servePublicFile(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const basePath = `./public${url.pathname}`;
	const accept = req.headers.get("accept-encoding") ?? "";

	let filePath = basePath;
	let encoding: string | null = null;

	// Prefer brotli, fall back to gzip — sidecars created by `bun run build`
	if (accept.includes("br")) {
		const br = Bun.file(`${basePath}.br`);
		if (await br.exists()) {
			filePath = `${basePath}.br`;
			encoding = "br";
		}
	}

	if (!encoding && accept.includes("gzip")) {
		const gz = Bun.file(`${basePath}.gz`);
		if (await gz.exists()) {
			filePath = `${basePath}.gz`;
			encoding = "gzip";
		}
	}

	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		return new Response("Not found", {
			status: 404,
			headers: SECURITY_HEADERS,
		});
	}

	const headers: Record<string, string> = {
		...SECURITY_HEADERS,
		// Fonts and images never change path between deploys — safe to cache forever.
		"Cache-Control": "public, max-age=31536000, immutable",
		"Vary": "Accept-Encoding",
	};
	if (encoding !== null) {
		headers["Content-Encoding"] = encoding;
	}

	return new Response(file, { headers });
}

/**
 * Bun HTTP server. Serves the portfolio home page, self-hosted static assets,
 * and the ASCII art `/figlet` API used by the terminal component.
 */
const server = Bun.serve({
	port: 3000,
	routes: {
		"/": index,
		"/fonts/*": servePublicFile,
		"/vendor/*": servePublicFile,
		"/images/*": servePublicFile,
		"/figlet": {
			GET: async (req) => {
				const query = new URLSearchParams(req.url.split("?")[1]);
				const text = query.get("text") ?? "Bun!";
				const body = figlet.textSync(text);
				return new Response(body, { headers: SECURITY_HEADERS });
			},
			POST: async (req) => {
				const body = await req.text();
				return new Response(body, { headers: SECURITY_HEADERS });
			},
		},
	},
});

console.log(`Listening on ${server.url}`);
