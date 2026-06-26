import { adoptStyles } from "../../shared/utils/adopt-styles.utils";
import cssText from "./photo-gallery.module.css" with { type: "text" };
import templateHtml from "./photo-gallery.template.html" with { type: "text" };

/** Parsed CSS stylesheet shared across all `<photo-gallery>` instances. */
const sheet: CSSStyleSheet = (() => {
	const s = new CSSStyleSheet();
	s.replaceSync(cssText.toString());
	return s;
})();

/**
 * `<photo-gallery>` — self-contained dog photo gallery component.
 *
 * Renders a static grid of four images wrapped in `.gallery` layout.
 * Content is defined in `photo-gallery.template.html` and injected into shadow DOM.
 * No observed attributes or consumer-facing slots — fully self-contained.
 *
 * @customElement photo-gallery
 */
class PhotoGallery extends HTMLElement {
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

customElements.define("photo-gallery", PhotoGallery);
