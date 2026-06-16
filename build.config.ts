import { htmlReplacePlugin } from 'plugins/html-placeholder-replace.plugin';
import { propertiesLoaderPlugin } from 'plugins/properties-loader.plugin';

const result = await Bun.build({
  entrypoints: ['src/main.ts', 'src/worker.ts'],
  outdir: 'dist',
  minify: true,
  sourcemap: true,
  splitting: true,
  target: 'browser',
  format: 'esm',
  plugins: [propertiesLoaderPlugin, htmlReplacePlugin],
});

if (!result.success) {
  console.error('Failed to build project');

  for (const error of result.logs) {
    console.error(error.message);
  }

  process.exit(1);
}

console.log('Build successful');
process.exit(0);
