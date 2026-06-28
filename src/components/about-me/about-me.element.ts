import templateHtml from "./about-me.template.html" with { type: "text" };

/**
 * `<about-me>` — self-contained biography component.
 *
 * Renders a static biography section into light DOM. Styles are applied via
 * the globally-linked `about-me.module.css`. No observed attributes or slots.
 *
 * @customElement about-me
 */
class AboutMe extends HTMLElement {
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

customElements.define("about-me", AboutMe);
