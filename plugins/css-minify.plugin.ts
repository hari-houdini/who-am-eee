import type { BunPlugin } from "bun";

/**
 * Bun build plugin that minifies Shadow DOM CSS text strings before they are
 * embedded in the JS bundle.
 *
 * Intercepts `*.module.css` files loaded as text (via
 * `import x from '*.module.css' with { type: 'text' }`). Strips block
 * comments, collapses whitespace, and removes spaces around structural
 * punctuation. Bun's JS minifier does not process CSS strings — this plugin
 * fills that gap for the Shadow DOM stylesheets bundled as raw text.
 *
 * @remarks
 * Does NOT intercept `global.css` or vendor CSS (`lenis.css`) — those are
 * served as static files, not imported as text modules.
 */
export const cssMinifyPlugin: BunPlugin = {
	name: "css-minify",
	setup(build) {
		build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
			let css = await Bun.file(args.path).text();

			// Strip block comments (including multi-line)
			css = css.replace(/\/\*[\s\S]*?\*\//g, "");

			// Collapse all whitespace (newlines, tabs, spaces) to a single space
			css = css.replace(/\s+/g, " ");

			// Remove spaces around structural punctuation
			css = css.replace(/\s*([{}:;,>~+])\s*/g, "$1");

			// Remove trailing semicolon immediately before a closing brace
			css = css.replace(/;}/g, "}");

			return { contents: css.trim(), loader: "text" };
		});
	},
};
