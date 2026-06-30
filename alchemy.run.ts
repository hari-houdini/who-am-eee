import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Effect from 'effect/Effect';

/**
 * Alchemy infrastructure stack for the HariHoudini portfolio.
 *
 * Deploys a Cloudflare Workers + Workers Assets site:
 * - `StaticSite` runs the production build, content-hashes `dist/`, and
 *   uploads static assets to Cloudflare's globally-distributed CDN.
 * - A thin `cf-worker.ts` handles the APIs and injects security
 *   headers on every response.
 * - Run with `bun alchemy.run.ts` (requires CLOUDFLARE_API_TOKEN +
 *   CLOUDFLARE_ACCOUNT_ID env vars).
 */
export default Alchemy.Stack(
  'HariHoudiniPortfolio',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const site = yield* Cloudflare.StaticSite('Portfolio', {
      dev: {
        command: 'bun run dev',
      },
      command: 'bun run build:prod',
      outdir: 'dist',
      main: './src/cloudfront.worker.ts',
      domain: ['harihoudini.dev', 'www.harihoudini.dev'],
    });

    return { url: site.url };
  }),
);
