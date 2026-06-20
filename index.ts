import figlet from 'figlet';
import index from './index.html';

/**
 * HTTP security headers applied to all non-HTML API and static-asset responses.
 *
 * @remarks
 * Bun's HTML-import routes do not accept custom `Response` wrappers, so the
 * main page (`/`) is served without these headers by the Bun bundler. All API
 * and static-file handlers below apply the full header set.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
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
    'upgrade-insecure-requests',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'accelerometer=(), gyroscope=(), magnetometer=()',
  'Strict-Transport-Security':
    'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-site',
};

/**
 * Serves a file from the `./public` directory based on the request path.
 *
 * @param req - Incoming request whose pathname maps directly to a file
 *   under `./public` (e.g. `/fonts/archivo-black-400.woff2`).
 * @returns File response with security headers, or 404 if the file does not exist.
 */
async function servePublicFile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const file = Bun.file(`./public${url.pathname}`);
  if (!(await file.exists())) {
    return new Response('Not found', {
      status: 404,
      headers: SECURITY_HEADERS,
    });
  }
  return new Response(file, { headers: SECURITY_HEADERS });
}

/**
 * Bun HTTP server. Serves the portfolio home page, self-hosted static assets,
 * and the ASCII art `/figlet` API used by the terminal component.
 */
const server = Bun.serve({
  port: 3000,
  routes: {
    '/': index,
    '/fonts/*': servePublicFile,
    '/vendor/*': servePublicFile,
    '/images/*': servePublicFile,
    '/figlet': {
      GET: async (req) => {
        const query = new URLSearchParams(req.url.split('?')[1]);
        const text = query.get('text') ?? 'Bun!';
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
