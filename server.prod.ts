import figlet from "figlet";

/** Shared non-CSP security headers applied to every response. */
const BASE_SECURITY_HEADERS: Record<string, string> = {
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
 * HTTP security headers for non-HTML asset responses (JS, CSS, fonts, images).
 * No nonce needed — assets contain no inline `<style>` elements.
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
	...BASE_SECURITY_HEADERS,
};

/**
 * Generates a cryptographically random base64 nonce for CSP.
 *
 * @returns 16-byte base64 string suitable for a `'nonce-…'` CSP source expression.
 */
function generateNonce(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes));
}

/**
 * Builds security headers for HTML responses, including a per-request CSP nonce.
 *
 * The nonce allows `<style>` elements stamped with the matching `nonce` attribute
 * (used by the Safari ≤ 16.3 `adoptedStyleSheets` fallback in web components)
 * while keeping `style-src 'self'` strict for all other inline styles.
 *
 * @param nonce - Base64 nonce string from {@link generateNonce}.
 * @returns Complete security header map for an HTML response.
 */
function buildHtmlHeaders(nonce: string): Record<string, string> {
	return {
		"Content-Security-Policy":
			"default-src 'self'; " +
			"script-src 'self'; " +
			`style-src 'self' 'nonce-${nonce}'; ` +
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
		...BASE_SECURITY_HEADERS,
	};
}

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
		const isHtml = contentType.includes("text/html");
		const isRoot = url.pathname === "/" || url.pathname === "/index.html";

		if (!(await file.exists())) {
			// Unknown path — serve index.html so client-side routing can take over.
			// Always read the HTML as text so we can inject the nonce.
			const [fallback] = await resolveDistFile("/", "");
			const nonce = generateNonce();
			const htmlText = await Bun.file(fallback).text();
			const injected = htmlText.replace(
				"</head>",
				`<meta name="csp-nonce" content="${nonce}"></head>`,
			);
			return new Response(injected, {
				headers: {
					...buildHtmlHeaders(nonce),
					"Cache-Control": "no-cache",
					"Content-Type": "text/html;charset=utf-8",
				},
			});
		}

		if (isHtml) {
			// Build the uncompressed base path directly — the nonce injection
			// requires plain text, so we never serve a compressed sidecar for HTML.
			const basePath =
				url.pathname === "/" ? `${DIST}/index.html` : `${DIST}${url.pathname}`;
			const nonce = generateNonce();
			const htmlText = await Bun.file(basePath).text();
			const injected = htmlText.replace(
				"</head>",
				`<meta name="csp-nonce" content="${nonce}"></head>`,
			);
			const htmlHeaders: Record<string, string> = {
				...buildHtmlHeaders(nonce),
				"Cache-Control": cacheControl(url.pathname),
				"Content-Type": "text/html;charset=utf-8",
			};
			if (isRoot) htmlHeaders.Link = ROOT_LINK_HEADER;
			return new Response(injected, { headers: htmlHeaders });
		}

		// Non-HTML assets: serve file directly, with compression sidecar if available.
		const headers: Record<string, string> = {
			...SECURITY_HEADERS,
			"Cache-Control": cacheControl(url.pathname),
			"Content-Type": contentType,
			Vary: "Accept-Encoding",
		};
		if (encoding !== null) {
			headers["Content-Encoding"] = encoding;
		}
		return new Response(file, { headers });
	},
});

console.log(`Serving dist/ on ${server.url}`);
