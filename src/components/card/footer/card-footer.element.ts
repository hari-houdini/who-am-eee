import templateHtml from "./card-footer.template.html" with { type: "text" };

/**
 * `<card-footer>` — renders the tags and year fields at the base of a card.
 *
 * Observed attributes `tags` and `year` populate their respective spans.
 * Set by the parent `<hyper-card>` during `connectedCallback`.
 *
 * @customElement card-footer
 */
class CardFooter extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["tags", "year"];
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
	 * @param name - The changed attribute name (`'tags'` or `'year'`).
	 * @param _oldValue - Previous attribute value (unused).
	 * @param newValue - New attribute value to apply.
	 */
	attributeChangedCallback(
		name: string,
		_oldValue: string | null,
		newValue: string | null,
	): void {
		if (name === "tags") {
			const tagsEl = this.querySelector<HTMLElement>(".card-footer__tags");
			if (tagsEl) tagsEl.textContent = newValue ?? "";
		} else if (name === "year") {
			const yearEl = this.querySelector<HTMLElement>(".card-footer__year");
			if (yearEl) yearEl.textContent = newValue ?? "";
		}
	}
}

customElements.define("card-footer", CardFooter);
