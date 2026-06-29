import templateHtml from "./hyper-cells.template.html" with { type: "text" };

/**
 * `<hyper-cells>` — a flex-wrap grid container for `<hyper-cell>` items.
 *
 * Children present before connect are collected, the template is hydrated into
 * light DOM, and the children are re-appended into the inner `<ul>`.
 *
 * @customElement hyper-cells
 */
class HyperCells extends HTMLElement {
	constructor() {
		super();
	}

	/**
	 * Hydrates template on first connect; moves pre-existing children into the
	 * inner `<ul class="hyper-cells">`.
	 */
	connectedCallback(): void {
		if (this.querySelector(".hyper-cells") !== null) return;

		const children = Array.from(this.children);
		for (const el of children) el.remove();

		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		Array.from(doc.body.childNodes).forEach((n) => {
			this.appendChild(n.cloneNode(true));
		});

		const list = this.querySelector(".hyper-cells");
		if (list) {
			for (const el of children) list.appendChild(el);
		}
	}

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
