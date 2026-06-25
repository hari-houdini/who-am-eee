import fs from "node:fs/promises";
import type { BunPlugin } from "bun";
import messages from "../resources/messages_en.properties";

/**
 * Bun build plugin that replaces `{{ key }}` placeholders in `.html` files
 * with the matching values from `messages_en.properties`.
 *
 * @remarks
 * All keys in the properties file are applied to each HTML file in sequence.
 * The replacement uses `String.replaceAll` so every occurrence of a key is
 * substituted, not just the first.
 */
export const htmlReplacePlugin: BunPlugin = {
	name: "html-replace-plugin",
	target: "bun",
	setup(build) {
		build.onLoad({ filter: /\.html$/ }, async (args) => {
			let text = await fs.readFile(args.path, { encoding: "utf8" });

			for (const [key, value] of Object.entries(messages)) {
				text = text.replaceAll(key, value);
			}

			// Minify component templates when re-enabled — not applied to the root
			// index.html entry point (handled by Bun's HTML bundler at a higher layer).
			if (args.path.endsWith(".template.html")) {
				text = text.replace(/<!--[\s\S]*?-->/g, ""); // strip HTML comments
				text = text.replace(/>\s+</g, "><"); // collapse whitespace between tags
				text = text.replace(/\s{2,}/g, " "); // collapse remaining whitespace runs
				text = text.trim();
			}

			return { contents: text, loader: "text" };
		});
	},
};
