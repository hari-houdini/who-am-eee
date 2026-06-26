/**
 * Injects a stylesheet into a shadow root using the most appropriate mechanism
 * for the current browser.
 *
 * Strategy:
 * 1. **`adoptedStyleSheets`** (Chrome 73+, Firefox 101+, Safari 16.4+) —
 *    zero DOM mutation; fully CSP-safe.
 * 2. **`<style>` element fallback** (Safari ≤ 16.3) — appends a `<style>`
 *    element to the shadow root. When a `<meta name="csp-nonce">` element is
 *    present in the outer document (injected by the production server), its
 *    `content` value is stamped onto the element's `nonce` attribute so the
 *    browser's `style-src` CSP directive allows it.
 *
 * @param shadow  - Target shadow root.
 * @param sheet   - Pre-constructed {@link CSSStyleSheet} for modern browsers.
 * @param cssText - Raw CSS text string for the `<style>` fallback path.
 */
function adoptStyles(
	shadow: ShadowRoot,
	sheet: CSSStyleSheet,
	cssText: string,
): void {
	if (shadow.adoptedStyleSheets !== undefined) {
		shadow.adoptedStyleSheets = [sheet];
	} else {
		const nonce =
			document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
				?.content ?? "";
		const style = document.createElement("style");
		style.textContent = cssText;
		if (nonce) style.setAttribute("nonce", nonce);
		shadow.appendChild(style);
	}
}

export { adoptStyles };
