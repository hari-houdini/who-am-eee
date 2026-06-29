import { adoptStyles } from "../../shared/utils/adopt-styles.utils";
import { loadHyperSpaceAnimation } from "./hyper.animation";
import hyperSpaceStyles from "./hyper.module.css" with { type: "text" };
import hyperSpaceTemplate from "./hyper.template.html" with { type: "text" };

/**
 * `<hyper-space>` custom element.
 *
 * Renders an interactive 3D hyper-space scene with scroll-driven animation,
 * mouse parallax, star particles, section labels, and portfolio cards.
 *
 * @customElement hyper-space
 * @remarks
 * Shadow DOM is attached in `mode: 'open'`. Styles are injected via
 * `adoptedStyleSheets`. The template HTML is parsed with `DOMParser` rather
 * than `innerHTML` to comply with the project's DOM-safety policy.
 */
class HyperSpaceWindow extends HTMLElement {
	/** Cleanup function returned by {@link loadHyperSpaceAnimation}. */
	#cleanup: (() => void) | null = null;

	constructor() {
		super();

		const parser = new DOMParser();
		const parsed = parser.parseFromString(`${hyperSpaceTemplate}`, "text/html");
		const template = document.createElement("template");
		Array.from(parsed.body.childNodes).map((node) =>
			template.content.appendChild(node.cloneNode(true)),
		);

		const shadowRoot = this.attachShadow({ mode: "open" });
		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(hyperSpaceStyles.toString());
		adoptStyles(shadowRoot, stylesheet, hyperSpaceStyles.toString());
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	/** Starts the hyper-space animation when the element is connected to the DOM. */
	connectedCallback(): void {
		this.#cleanup = loadHyperSpaceAnimation(this);
	}

	/** Cancels the RAF loop and scroll listener when the element is removed. */
	disconnectedCallback(): void {
		this.#cleanup?.();
		this.#cleanup = null;
	}

	/** No action required when the element is adopted into a new document. */
	adoptedCallback(): void {
		// No-op.
	}

	/**
	 * Responds to observed attribute changes.
	 *
	 * @param name - Attribute name that changed.
	 * @param oldValue - Previous value, or `null` if the attribute was not set.
	 * @param newValue - New value, or `null` if the attribute was removed.
	 */
	attributeChangedCallback(
		name: string,
		oldValue: string | null,
		newValue: string | null,
	): void {
		// No observed attributes are currently defined.
		void name;
		void oldValue;
		void newValue;
	}
}

customElements.define("hyper-space", HyperSpaceWindow);
