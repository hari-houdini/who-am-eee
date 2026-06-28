import templateHtml from "./locked.template.html" with { type: "text" };

/**
 * `<forbidden-space>` — self-contained component to hide content behind a lock.
 *
 * Renders into light DOM. Styles are applied via the globally-linked
 * `locked.module.css`. No observed attributes or consumer-facing slots.
 *
 * @customElement forbidden-space
 */
class ForbiddenSpace extends HTMLElement {
	/**
	 * Hydrates the component from its HTML template on first connection.
	 * DOM construction here (not in the constructor) satisfies the Custom Elements spec,
	 * which forbids appending to `this` before the constructor returns.
	 * The `firstChild` guard prevents double-render on re-connection.
	 */
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

	/** No-op: no listeners or RAF loops to clean up. */
	disconnectedCallback(): void {}

	/** No-op: component ignores document adoption. */
	adoptedCallback(): void {}

	/** No-op: no observed attributes. */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {}
}

customElements.define("forbidden-space", ForbiddenSpace);
