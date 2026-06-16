import type { BunPlugin } from 'bun';

export const propertiesLoaderPlugin: BunPlugin = {
  name: 'properties-loader',
  target: 'bun',
  setup(build) {
    build.onLoad({ filter: /\.properties$/ }, async (args) => {
      console.log('Loading properties file:', args.path);
      const text = await Bun.file(args.path).text();
      console.log('Properties file text:', text);

      const result: Record<string, string> = {};

      // Parse line-by-line, skipping comments and empty lines
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        console.log('Trimmed line:', trimmed);
        if (
          !trimmed ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('!')
        ) {
          console.log('Skipping line:', trimmed);
          continue;
        }

        const delimiterIdx = trimmed.indexOf('=');
        console.log('Delimiter index:', delimiterIdx);

        if (delimiterIdx !== -1) {
          const key = trimmed.substring(0, delimiterIdx).trim();
          const value = trimmed.substring(delimiterIdx + 1).trim();
          result[key] = value;
          console.log('Added key:', key, 'with value:', value);
        }
      }

      console.log('Final result:', result);

      return {
        contents: `export default ${JSON.stringify(result)};`,
        loader: 'js',
      };
    });
  },
};
