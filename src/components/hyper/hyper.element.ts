import { loadHyperSpaceAnimation } from "./hyper.animation";
import hyperSpaceTemplate from "./hyper.template.html" with { type: "text" };

/**
 * `<hyper-space>` custom element.
 *
 * Renders an interactive 3D hyper-space scene with scroll-driven animation,
 * mouse parallax, star particles, section labels, and portfolio cards.
 *
 * @customElement hyper-space
 * @remarks
 * Uses light DOM. Styles are loaded via `<link rel="stylesheet">` in `index.html`.
 * The template HTML is parsed with `DOMParser` rather than `innerHTML` to comply
 * with the project's DOM-safety policy.
 */
class HyperSpaceWindow extends HTMLElement {
	/** Cleanup function returned by {@link loadHyperSpaceAnimation}. */
	#cleanup: (() => void) | null = null;

	constructor() {
		super();
	}

	/** Hydrates template HTML on first connect, then starts the animation. */
	connectedCallback(): void {
		if (this.firstChild === null) {
			const parser = new DOMParser();
			const parsed = parser.parseFromString(
				`${hyperSpaceTemplate}`,
				"text/html",
			);
			Array.from(parsed.body.childNodes).forEach((node) => {
				this.appendChild(node.cloneNode(true));
			});
		}
		this.#cleanup = loadHyperSpaceAnimation(this);
	}

	/** Cancels the RAF loop and scroll listener when the element is removed. */
	disconnectedCallback(): void {
		this.#cleanup?.();
		this.#cleanup = null;
	}

	/** No action required when the element is adopted into a new document. */
	adoptedCallback(): void {}

	/**
	 * Responds to observed attribute changes.
	 *
	 * @param _name - Attribute name that changed.
	 * @param _oldValue - Previous value, or `null` if the attribute was not set.
	 * @param _newValue - New value, or `null` if the attribute was removed.
	 */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {}
}

customElements.define("hyper-space", HyperSpaceWindow);
