import { htmlReplacePlugin } from 'plugins/html-placeholder-replace.plugin';
import { propertiesLoaderPlugin } from 'plugins/properties-loader.plugin';

const result = await Bun.build({
  entrypoints: [
    'src/main.ts',
    'src/worker.ts',
    'index.html',
    'resources/messages_en.properties',
  ],
  outdir: 'dist',
  minify: true,
  sourcemap: process.env.NODE_ENV === 'production' ? 'none' : true,
  splitting: true,
  target: 'browser',
  format: 'esm',
  plugins: [propertiesLoaderPlugin, htmlReplacePlugin],
});

for (const error of result.logs) {
  console.info(error.message);
}

if (!result.success) {
  console.error('Failed to build project');
  process.exit(1);
}

console.log('Build successful');
process.exit(0);
