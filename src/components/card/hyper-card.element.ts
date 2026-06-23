import cssText from "./hyper-card.module.css" with { type: "text" };
import templateHtml from "./hyper-card.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<hyper-card>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<hyper-card>` — outer shell for a portfolio card in the 3D hyper-space scene.
 *
 * Composes `<card-header>`, `<card-body>`, and `<card-footer>` sub-components.
 * Observed attributes are forwarded to sub-components on connect and change.
 * A `body-content` named slot is forwarded through `<card-body>` to display
 * consumer-provided body elements (e.g. `<about-me>`, `<hyper-cells>`, or a `<div>`).
 *
 * @customElement hyper-card
 * @remarks
 * Sub-components must be registered before `<hyper-card>` connects to the DOM.
 * See `src/main.ts` for the required import order.
 */
class HyperCard extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["size", "card-id", "heading", "tags", "year"];
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

	/**
	 * Forwards own attributes to `<card-header>`, `<card-body>`, and `<card-footer>`
	 * once the element is connected and sub-components are ready.
	 */
	connectedCallback(): void {
		this.#syncSubComponents();
	}

	/** No-op: no listeners or RAF loops to clean up. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Re-syncs sub-component attributes whenever an observed attribute changes.
	 *
	 * @param _name - The changed attribute name (unused; all attrs re-synced).
	 * @param _oldValue - Previous value (unused).
	 * @param _newValue - New value (unused).
	 */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {
		this.#syncSubComponents();
	}

	/**
	 * Reads own observed attributes and sets them on the shadow DOM sub-components.
	 *
	 * @remarks
	 * Called from both {@link connectedCallback} and {@link attributeChangedCallback}
	 * so sub-components always reflect the latest attribute state.
	 */
	#syncSubComponents(): void {
		const root = this.shadowRoot;
		if (!root) return;

		const header = root.querySelector<HTMLElement>("card-header");
		if (header) {
			header.setAttribute("card-id", this.getAttribute("card-id") ?? "");
		}

		const body = root.querySelector<HTMLElement>("card-body");
		if (body) {
			body.setAttribute("heading", this.getAttribute("heading") ?? "");
		}

		const footer = root.querySelector<HTMLElement>("card-footer");
		if (footer) {
			footer.setAttribute("tags", this.getAttribute("tags") ?? "");
			footer.setAttribute("year", this.getAttribute("year") ?? "");
		}
	}
}

customElements.define("hyper-card", HyperCard);
