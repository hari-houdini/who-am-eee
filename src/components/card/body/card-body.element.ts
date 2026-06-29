import templateHtml from "./card-body.template.html" with { type: "text" };

/**
 * `<card-body>` — renders a card heading and a content area.
 *
 * Observed attribute `heading` populates the `.card-body__heading` element.
 * Body content is placed into `.card-body__content` by the parent `<hyper-card>`
 * immediately after this element connects.
 *
 * @customElement card-body
 */
class CardBody extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["heading"];
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
		if (name === "heading") {
			const headingEl = this.querySelector<HTMLElement>(".card-body__heading");
			if (headingEl) {
				headingEl.textContent = newValue ?? "";
			}
		}
	}
}

customElements.define("card-body", CardBody);
