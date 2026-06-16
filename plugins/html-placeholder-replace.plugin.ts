import fs from 'node:fs/promises';
import type { BunPlugin } from 'bun';
import messages from '../resources/messages_en.properties';

export const htmlReplacePlugin: BunPlugin = {
  name: 'html-replace-plugin',
  target: 'bun',
  setup(build) {
    build.onLoad({ filter: /\.html$/ }, async (args) => {
      console.log('Loading HTML file:', args.path);
      const text = await fs.readFile(args.path, { encoding: 'utf8' });
      console.log('HTML file text:', text);
      let updatedText = '';

      // Loop and replace keys
      for (const [key, value] of Object.entries(messages)) {
        console.log('Replacing key:', key, 'with value:', value);
        updatedText = text.replaceAll(key, value);
      }

      console.log('Updated HTML text:', updatedText);

      return { contents: updatedText, loader: 'text' };
    });
  },
};
