import cssText from "./career-timeline.module.css" with { type: "text" };
import templateHtml from "./career-timeline.template.html" with {
	type: "text",
};

/** Parsed CSS stylesheet shared across all `<career-timeline>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<career-timeline>` — vertical accordion career and education history component.
 *
 * Renders four career stages (ECE → Zoho → Warwick → Pixel Toys) as a flex
 * column of background-image panels. Each panel shows a header (title, org,
 * period) in its collapsed state (10% of container height). On `:hover` or
 * keyboard `:focus`, the active panel expands to 70% of the container height
 * and the detail content fades in. The remaining three panels each shrink to
 * 10%. All interaction is pure CSS — no JavaScript animation logic.
 *
 * Under `prefers-reduced-motion: reduce`, all panels are fully visible and
 * no transitions fire.
 *
 * @customElement career-timeline
 */
class CareerTimeline extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });

		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		Array.from(doc.body.childNodes).forEach((n) => {
			shadow.appendChild(n.cloneNode(true));
		});

		if (shadow.adoptedStyleSheets !== undefined) {
			shadow.adoptedStyleSheets = [sheet];
		} else {
			const style = document.createElement("style");
			style.textContent = cssText.toString();
			shadow.appendChild(style);
		}
	}

	/** No-op: accordion interaction is handled entirely by CSS. */
	connectedCallback(): void {}

	/** No-op: no resources to release. */
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

customElements.define("career-timeline", CareerTimeline);
