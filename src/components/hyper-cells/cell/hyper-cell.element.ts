import templateHtml from "./hyper-cell.template.html" with { type: "text" };

/**
 * `<hyper-cell>` — an individual technology or methodology item in the capabilities grid.
 *
 * Accepts an `href` attribute that is forwarded to the inner anchor element.
 * Consumers supply icon and label content with `slot="hyper-cell-icon"` and
 * `slot="hyper-cell-label"` attributes. These slotted children are collected
 * before hydration and moved into `.hyper-cell__icon` and `.hyper-cell__label`
 * after the template is appended to light DOM.
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
	}

	/**
	 * Hydrates template on first connect. Collects slot children before hydration
	 * and moves them into the correct spans after the template is in light DOM.
	 * Applies the `href` attribute to the inner anchor after hydration.
	 */
	connectedCallback(): void {
		if (this.querySelector(".hyper-cell__link") !== null) {
			// Already hydrated (re-connection). Ensure href is up-to-date.
			const link = this.querySelector<HTMLAnchorElement>(".hyper-cell__link");
			if (link) link.href = this.getAttribute("href") ?? "";
			return;
		}

		const iconEl = this.querySelector<Element>('[slot="hyper-cell-icon"]');
		const labelEl = this.querySelector<Element>('[slot="hyper-cell-label"]');
		if (iconEl) iconEl.remove();
		if (labelEl) labelEl.remove();

		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		Array.from(doc.body.childNodes).forEach((n) => {
			this.appendChild(n.cloneNode(true));
		});

		const link = this.querySelector<HTMLAnchorElement>(".hyper-cell__link");
		if (link) link.href = this.getAttribute("href") ?? "";

		const iconSpan = this.querySelector(".hyper-cell__icon");
		const labelSpan = this.querySelector(".hyper-cell__label");
		if (iconSpan && iconEl) iconSpan.appendChild(iconEl);
		if (labelSpan && labelEl) labelSpan.appendChild(labelEl);
	}

	/** No-op: no listeners to detach. */
	disconnectedCallback(): void {}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Forwards the `href` attribute to the inner `<a>` element in light DOM.
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
			const link = this.querySelector<HTMLAnchorElement>(".hyper-cell__link");
			if (link) link.href = newValue ?? "";
		}
	}
}

customElements.define("hyper-cell", HyperCell);
