import cssText from "./hyper-cells.module.css" with { type: "text" };
import templateHtml from "./hyper-cells.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<hyper-cells>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<hyper-cells>` — a flex-wrap grid container for `<hyper-cell>` items.
 *
 * Uses a default slot to accept any number of `<hyper-cell>` children.
 * Provides the list semantics (`<ul role="list">`) and grid layout;
 * individual items are styled by `<hyper-cell>` itself.
 *
 * @customElement hyper-cells
 */
class HyperCells extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });

		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		Array.from(doc.body.childNodes).map((n) =>
			shadow.appendChild(n.cloneNode(true)),
		);

		if (shadow.adoptedStyleSheets !== undefined) {
			shadow.adoptedStyleSheets = [sheet];
		} else {
			const style = document.createElement("style");
			style.textContent = cssText.toString();
			shadow.appendChild(style);
		}
	}

	/** No-op: purely structural container with no dynamic behaviour. */
	connectedCallback(): void {}

	/** No-op: no listeners to detach. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/** No-op: no observed attributes. */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {}
}

customElements.define("hyper-cells", HyperCells);
