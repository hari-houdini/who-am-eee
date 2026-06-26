import { adoptStyles } from "../../../shared/utils/adopt-styles.utils";
import cssText from "./card-header.module.css" with { type: "text" };
import templateHtml from "./card-header.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<card-header>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<card-header>` — renders a card identifier and arrow indicator.
 *
 * Observed attribute `card-id` populates the `.card-header__id` span.
 * Intended to be used as a child of `<hyper-card>` which sets attributes
 * via its own `connectedCallback`.
 *
 * @customElement card-header
 */
class CardHeader extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["card-id"];
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

		adoptStyles(shadow, sheet, cssText.toString());
	}

	/** No-op: attribute-driven component, no DOM side-effects on connect. */
	connectedCallback(): void {}

	/** No-op: no listeners to detach. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Syncs observed attribute changes to the shadow DOM.
	 *
	 * @param name - The changed attribute name.
	 * @param _oldValue - Previous attribute value (unused).
	 * @param newValue - New attribute value to apply.
	 */
	attributeChangedCallback(
		name: string,
		_oldValue: string | null,
		newValue: string | null,
	): void {
		if (name === "card-id") {
			const idEl =
				this.shadowRoot?.querySelector<HTMLElement>(".card-header__id");
			if (idEl) idEl.textContent = newValue ?? "";
		}
	}
}

customElements.define("card-header", CardHeader);
