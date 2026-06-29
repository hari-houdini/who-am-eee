import type { CardOpenDetail } from "../../shared/types/card-modal.types";
import templateHtml from "./hyper-card.template.html" with { type: "text" };

/**
 * `<hyper-card>` — outer shell for a portfolio card in the 3D hyper-space scene.
 *
 * Composes `<card-header>`, `<card-body>`, and `<card-footer>` sub-components.
 * Observed attributes are forwarded to sub-components on connect and change.
 * Body content supplied with `slot="body-content"` is collected before template
 * hydration and moved into `.card-body__content` after `<card-body>` connects.
 *
 * When the `modal` attribute is present, the card becomes an interactive button
 * that dispatches `card:open` on `window`, consumed by `<card-modal>`.
 * The `↗` arrow in `<card-header>` becomes visible only on modal-enabled cards.
 *
 * @customElement hyper-card
 * @remarks
 * Sub-components must be registered before `<hyper-card>` connects to the DOM.
 * See `src/main.ts` for the required import order.
 */
class HyperCard extends HTMLElement {
	/** Attributes that trigger {@link attributeChangedCallback}. */
	static get observedAttributes(): string[] {
		return ["size", "card-id", "heading", "tags", "year"];
	}

	/**
	 * AbortController for the modal click/keyboard listeners.
	 * `undefined` when this card has no `modal` attribute.
	 */
	#modalAc: AbortController | undefined = undefined;

	constructor() {
		super();
	}

	/**
	 * Hydrates template on first connect, forwarding `[slot="body-content"]` children
	 * into `.card-body__content`. Wires modal interaction if the `modal` attribute
	 * is present.
	 */
	connectedCallback(): void {
		if (this.querySelector(".hyper-card") !== null) {
			if (this.hasAttribute("modal")) this.#bindModalInteraction();
			return;
		}

		// Collect and detach body-content children BEFORE appending template
		// so the sub-component query in card-body.connectedCallback finds an empty slot.
		const bodyEls = Array.from(
			this.querySelectorAll<Element>('[slot="body-content"]'),
		);
		for (const el of bodyEls) el.remove();

		const parser = new DOMParser();
		const doc = parser.parseFromString(
			templateHtml as unknown as string,
			"text/html",
		);
		// Each appendChild fires sub-component connectedCallback synchronously,
		// so card-body is fully hydrated by the time we query .card-body__content.
		Array.from(doc.body.childNodes).forEach((n) => {
			this.appendChild(n.cloneNode(true));
		});

		const content = this.querySelector(".card-body__content");
		if (content) {
			for (const el of bodyEls) content.appendChild(el);
		}

		this.#syncSubComponents();
		if (this.hasAttribute("modal")) this.#bindModalInteraction();
	}

	/** Aborts modal interaction listeners when the element leaves the DOM. */
	disconnectedCallback(): void {
		this.#modalAc?.abort();
	}

	/** No-op: no document-adoption behaviour. */
	adoptedCallback(): void {}

	/**
	 * Re-syncs sub-component attributes whenever an observed attribute changes.
	 *
	 * @param _name - The changed attribute name (unused; all attrs re-synced).
	 * @param _oldValue - Previous value (unused).
	 * @param _newValue - New value (unused).
	 */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {
		this.#syncSubComponents();
	}

	/**
	 * Reads own observed attributes and sets them on the light DOM sub-components.
	 * Also forwards the `modal` attribute to `<card-header>` so the arrow indicator
	 * becomes visible via `card-header[modal] .card-header__arrow { display: block }`.
	 *
	 * @remarks
	 * Called from both {@link connectedCallback} and {@link attributeChangedCallback}
	 * so sub-components always reflect the latest attribute state.
	 */
	#syncSubComponents(): void {
		const header = this.querySelector<HTMLElement>("card-header");
		if (header) {
			header.setAttribute("card-id", this.getAttribute("card-id") ?? "");
			if (this.hasAttribute("modal")) {
				header.setAttribute("modal", "");
			} else {
				header.removeAttribute("modal");
			}
		}

		const body = this.querySelector<HTMLElement>("card-body");
		if (body) {
			body.setAttribute("heading", this.getAttribute("heading") ?? "");
		}

		const footer = this.querySelector<HTMLElement>("card-footer");
		if (footer) {
			footer.setAttribute("tags", this.getAttribute("tags") ?? "");
			footer.setAttribute("year", this.getAttribute("year") ?? "");
		}
	}

	/**
	 * Makes this card a keyboard-focusable button and registers `click` / `keydown`
	 * listeners that dispatch `card:open` on `window`.
	 */
	#bindModalInteraction(): void {
		if (this.#modalAc) return;
		this.setAttribute("role", "button");
		this.setAttribute("tabindex", "0");
		this.#modalAc = new AbortController();
		const { signal } = this.#modalAc;
		this.addEventListener("click", this.#dispatchOpen, { signal });
		this.addEventListener("keydown", this.#handleKeyActivation, { signal });
	}

	/**
	 * Dispatches `card:open` on `window` with the card's heading and body-tag
	 * so `<card-modal>` can populate and display the correct content.
	 */
	readonly #dispatchOpen = (): void => {
		const detail: CardOpenDetail = {
			heading: this.getAttribute("heading") ?? "",
			bodyTag: this.getAttribute("body-tag") ?? "",
			cardId: this.getAttribute("card-id") ?? "",
		};
		window.dispatchEvent(
			new CustomEvent<CardOpenDetail>("card:open", { detail }),
		);
	};

	/**
	 * Activates the card on Enter or Space, matching native button keyboard behaviour.
	 *
	 * @param e - The keyboard event from the card host element.
	 */
	readonly #handleKeyActivation = (e: KeyboardEvent): void => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			this.#dispatchOpen();
		}
	};
}

customElements.define("hyper-card", HyperCard);
