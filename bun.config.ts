import { defineConfig } from 'rolldown';
import { bundleAnalyzerPlugin } from 'rolldown/experimental';

export default defineConfig([
  {
    input: 'src/main.ts',
    output: {
      format: 'esm',
      sourcemap:
        process.env.NODE_ENV === 'production' ? 'hidden' : true,
    },
    plugins: [
      bundleAnalyzerPlugin({
        format: 'md',
      }),
    ],
  },
  {
    input: 'src/worker.ts',
    output: {
      format: 'iife',
      dir: 'dist/worker',
    },
    plugins: [
      bundleAnalyzerPlugin({
        format: 'md',
      }),
    ],
  },
]);
