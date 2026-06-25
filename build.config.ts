// import { htmlReplacePlugin } from "plugins/html-placeholder-replace.plugin";
// import { propertiesLoaderPlugin } from "plugins/properties-loader.plugin";
import { cssMinifyPlugin } from 'plugins/css-minify.plugin';

/**
 * Production build script. Bundles all entry points into `dist/` via Bun's
 * native bundler.
 */
const isProd = Bun.env.NODE_ENV === 'production';

const result = await Bun.build({
  entrypoints: [
    'src/main.ts',
    'src/worker.ts',
    'index.html',
    // "resources/messages_en.properties",
  ],
  outdir: 'dist',

  minify: isProd,

  sourcemap: isProd ? 'none' : 'inline',

  splitting: true,

  // Hashed chunk names enable `Cache-Control: immutable` on code-split pieces
  // — the URL changes whenever content changes, so browsers can cache forever.
  naming: { chunk: 'chunks/[name]-[hash].[ext]' },

  target: 'browser',
  format: 'esm',

  // Strip all console.* calls and debugger statements from the production bundle.
  drop: isProd ? ['console', 'debugger'] : [],

  // Inline NODE_ENV so Lenis and other libraries tree-shake dev-only branches.
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      isProd ? 'production' : 'development',
    ),
  },

  plugins: [
    cssMinifyPlugin,
    // propertiesLoaderPlugin,  // re-enable with i18n plan
    // htmlReplacePlugin,       // re-enable with i18n plan
  ],
});

for (const log of result.logs) {
  console.info(log.message);
}

if (!result.success) {
  console.error('Build failed');
  process.exit(1);
}

// Post-build: pre-compress all JS, CSS and HTML with brotli and gzip.
// The Bun server reads these sidecar files when Accept-Encoding matches,
// serving pre-compressed responses with zero CPU cost per request.
if (isProd) {
  const files = await Array.fromAsync(
    new Bun.Glob('**/*.{js,css,html}').scan({ cwd: './dist' }),
  );
  await Promise.all(
    files.flatMap((f) => [
      Bun.$`gzip -k -f -9 dist/${f}`.quiet(),
      Bun.$`brotli -k -f --best dist/${f}`.quiet(),
    ]),
  );
  console.log(`Compressed ${files.length} assets`);
}

console.log('Build complete');
process.exit(0);
