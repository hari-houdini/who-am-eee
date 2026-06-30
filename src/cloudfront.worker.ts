import figlet from 'figlet';
import Standard from 'figlet/importable-fonts/3-D.js';

figlet.parseFont('3-D', Standard);

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
};

/**
 * Security headers applied to every response served by this Worker.
 * `upgrade-insecure-requests` and `Strict-Transport-Security` are safe here
 * because Cloudflare always terminates TLS before requests reach the Worker.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
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
 * Cloudflare Worker entry point.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log(request.url);
    if (request.method === 'GET') {
      // Serve static asset via Workers Assets CDN.
      // Copy the response so headers are mutable (Workers Assets responses
      // are immutable), then inject security headers.
      const asset = await env.ASSETS.fetch(request);

      if (asset?.ok) {
        const response = new Response(asset.body, asset);
        for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
          response.headers.set(k, v);
        }
        return response;
      }
    }

    return new Response(
      figlet.textSync("Uh-Oh. I'm too lazy to work on this sh*t.", {
        font: '3-D',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          ...SECURITY_HEADERS,
        },
      },
    );
  },
};
