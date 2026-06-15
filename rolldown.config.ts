import { defineConfig } from 'rolldown';
import { bundleAnalyzerPlugin } from 'rolldown/experimental';

export default defineConfig([
  {
    input: 'src/main.ts',
    external: ['bun', /^bun:/],
    output: {
      format: 'esm',
      sourcemap:
        process.env.NODE_ENV === 'production' ? 'hidden' : true,
      plugins: [
        bundleAnalyzerPlugin({
          format: 'md',
        }),
      ],
    },
  },
  {
    input: 'src/worker.ts',
    external: ['bun', /^bun:/],
    output: {
      format: 'iife',
      dir: 'dist/worker',
      sourcemap:
        process.env.NODE_ENV === 'production' ? 'hidden' : true,
      plugins: [
        bundleAnalyzerPlugin({
          format: 'md',
        }),
      ],
    },
  },
]);
