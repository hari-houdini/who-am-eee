import { adoptStyles } from "../../shared/utils/adopt-styles.utils";
import cssText from "./about-me.module.css" with { type: "text" };
import templateHtml from "./about-me.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<about-me>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<about-me>` — self-contained biography component.
 *
 * Renders a static biography section with no observed attributes or slots.
 * Content is defined in `about-me.template.html` and injected into shadow DOM.
 *
 * @customElement about-me
 */
class AboutMe extends HTMLElement {
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

	/** No-op: component is fully static, no setup needed on connection. */
	connectedCallback(): void {}

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
