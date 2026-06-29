import templateHtml from "./card-header.template.html" with { type: "text" };

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
	}

	/** Hydrates template HTML into light DOM on first connection. */
	connectedCallback(): void {
		if (this.firstChild !== null) return;
		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		Array.from(doc.body.childNodes).forEach((n) => {
			this.appendChild(n.cloneNode(true));
		});
	}

	/** No-op: no listeners to detach. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Syncs observed attribute changes to the light DOM.
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
			const idEl = this.querySelector<HTMLElement>(".card-header__id");
			if (idEl) idEl.textContent = newValue ?? "";
		}
	}
}

customElements.define("card-header", CardHeader);
