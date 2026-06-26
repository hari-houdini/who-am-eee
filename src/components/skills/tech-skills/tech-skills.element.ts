import { adoptStyles } from "../../../shared/utils/adopt-styles.utils";
import cssText from "./tech-skills.module.css" with { type: "text" };
import templateHtml from "./tech-skills.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<tech-skills>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<tech-skills>` — self-contained technology stack grid component.
 *
 * Renders a static grid of `<hyper-cell>` items wrapped in `<hyper-cells>`.
 * Content is defined in `tech-skills.template.html` and injected into shadow DOM.
 * No observed attributes or consumer-facing slots — fully self-contained.
 *
 * @customElement tech-skills
 */
class TechSkills extends HTMLElement {
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

customElements.define("tech-skills", TechSkills);
