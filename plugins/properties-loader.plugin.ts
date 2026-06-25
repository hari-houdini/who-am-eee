import type { BunPlugin } from "bun";

/**
 * Bun build plugin that transforms `.properties` files into ES modules.
 *
 * Each `key=value` line becomes a named entry in the exported default object.
 * Lines starting with `#` or `!` and blank lines are skipped. The output is
 * equivalent to `export default { key: 'value', ... }`.
 *
 * @remarks
 * Uses `Bun.file` for I/O rather than `node:fs` to comply with project tooling
 * conventions. The plugin is registered in `build.config.ts`.
 */
export const propertiesLoaderPlugin: BunPlugin = {
	name: "properties-loader",
	target: "bun",
	setup(build) {
		build.onLoad({ filter: /\.properties$/ }, async (args) => {
			const text = await Bun.file(args.path).text();
			const result: Record<string, string> = {};

			for (const line of text.split(/\r?\n/)) {
				const trimmed = line.trim();

				if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
					continue;
				}

				const delimiterIdx = trimmed.indexOf("=");

				if (delimiterIdx !== -1) {
					const key = trimmed.substring(0, delimiterIdx).trim();
					const value = trimmed.substring(delimiterIdx + 1).trim();
					result[key] = value;
				}
			}

			return {
				contents: `export default ${JSON.stringify(result)};`,
				loader: "js",
			};
		});
	},
};
