import cssText from "./hyper-cell.module.css" with { type: "text" };
import templateHtml from "./hyper-cell.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<hyper-cell>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<hyper-cell>` — an individual technology or methodology item in the capabilities grid.
 *
 * Accepts an `href` attribute that is forwarded to the inner anchor element.
 * Consumers supply icon and label content via named slots:
 * - `hyper-cell-icon` — typically an `<svg>` icon.
 * - `hyper-cell-label` — typically a `<span>` with the technology name.
 *
 * Shadow DOM is attached in the constructor so `attributeChangedCallback` fires
 * correctly when the element is upgraded (before `connectedCallback`).
 *
 * @customElement hyper-cell
 */
class HyperCell extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["href"];
	}

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

	/** No-op: href is set via attribute before or at connect time. */
	connectedCallback(): void {}

	/** No-op: no listeners to detach. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Forwards the `href` attribute to the inner `<a>` element in shadow DOM.
	 *
	 * @param name - The changed attribute name.
	 * @param _oldValue - Previous value (unused).
	 * @param newValue - New value to apply.
	 */
	attributeChangedCallback(
		name: string,
		_oldValue: string | null,
		newValue: string | null,
	): void {
		if (name === "href") {
			const link =
				this.shadowRoot?.querySelector<HTMLAnchorElement>(".hyper-cell__link");
			if (link) link.href = newValue ?? "";
		}
	}
}

customElements.define("hyper-cell", HyperCell);
