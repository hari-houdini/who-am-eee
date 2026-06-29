import type { CardOpenDetail } from "../../shared/types/card-modal.types";
import { createCardBodyElement } from "../../shared/utils/card-body.factory";
import templateHtml from "./card-modal.template.html" with { type: "text" };

/**
 * Queries `root` for `selector` and returns the matching element.
 * Throws at connect time if the template is malformed, making the failure
 * loud and immediate rather than a silent `null` dereference at interaction time.
 *
 * @param root - Light DOM host element to search within.
 * @param selector - CSS selector for the required element.
 * @returns The first matching element cast to `T`.
 * @throws {Error} When the selector matches nothing.
 */
function requireEl<T extends Element>(root: HTMLElement, selector: string): T {
	const el = root.querySelector<T>(selector);
	if (!el) {
		throw new Error(
			`<card-modal>: required element "${selector}" not in template`,
		);
	}
	return el;
}

/**
 * `<card-modal>` — singleton fullscreen modal overlay for portfolio card content.
 *
 * Listens on `window` for a `card:open` custom event dispatched by `<hyper-card>`.
 * Opens with a scale-in animation and closes on Escape, close-button click, or
 * backdrop click.
 *
 * Dispatches `card:modal-opened` and `card:modal-closed` on `window` so that
 * `hyper.animation.ts` can pause and resume the scroll animation.
 *
 * Accessibility: ARIA dialog pattern with focus trap and focus return.
 *
 * @customElement card-modal
 */
class CardModal extends HTMLElement {
	/** AbortController used to remove all event listeners on disconnect. */
	#ac: AbortController = new AbortController();

	/** The element that held focus before the modal opened; restored on close. */
	#previousFocus: HTMLElement | null = null;

	/** Dark backdrop element. */
	#overlayEl!: HTMLElement;

	/** Full-screen flex container that centres the inset and handles backdrop clicks. */
	#frameEl!: HTMLElement;

	/** The visible modal box; receives focus on open. */
	#insetEl!: HTMLElement;

	/** `<h2>` element that labels the dialog via `aria-labelledby`. */
	#titleEl!: HTMLElement;

	/** Container for the card body custom element. */
	#bodyEl!: HTMLElement;

	/** Button that closes the modal. */
	#closeBtn!: HTMLButtonElement;

	constructor() {
		super();
	}

	/** Hydrates template, caches element references, and binds all event listeners. */
	connectedCallback(): void {
		if (this.firstChild === null) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(
				templateHtml as unknown as string,
				"text/html",
			);
			Array.from(doc.body.childNodes).forEach((n) => {
				this.appendChild(n.cloneNode(true));
			});
		}

		this.#overlayEl = requireEl<HTMLElement>(this, ".card-modal__overlay");
		this.#frameEl = requireEl<HTMLElement>(this, ".card-modal__frame");
		this.#insetEl = requireEl<HTMLElement>(this, ".card-modal__inset");
		this.#titleEl = requireEl<HTMLElement>(this, ".card-modal__title");
		this.#bodyEl = requireEl<HTMLElement>(this, ".card-modal__body");
		this.#closeBtn = requireEl<HTMLButtonElement>(this, ".card-modal__close");

		this.#ac = new AbortController();
		const { signal } = this.#ac;

		window.addEventListener("card:open", this.#handleOpen, { signal });
		this.#closeBtn.addEventListener("click", this.#close, { signal });
		this.#frameEl.addEventListener("mousedown", this.#handleBackdropClick, {
			signal,
		});
		this.#insetEl.addEventListener("keydown", this.#handleKeydown, { signal });
		this.#insetEl.addEventListener("animationend", this.#handleAnimationEnd, {
			signal,
		});

		// Stops touch propagation so touches inside the modal don't scroll the
		// page behind it, allowing native overflow-y scroll to work on mobile.
		const stopTouch = (e: TouchEvent): void => {
			e.stopPropagation();
		};
		this.#insetEl.addEventListener("touchstart", stopTouch, {
			signal,
			passive: true,
		});
		this.#insetEl.addEventListener("touchmove", stopTouch, {
			signal,
			passive: true,
		});
	}

	/** Removes all event listeners via AbortController. */
	disconnectedCallback(): void {
		this.#ac.abort();
	}

	/** No-op: component ignores document adoption. */
	adoptedCallback(): void {}

	/** No-op: no observed attributes. */
	attributeChangedCallback(
		_name: string,
		_oldValue: string | null,
		_newValue: string | null,
	): void {}

	/**
	 * Handles the `card:open` window event.
	 * Sets modal content, triggers the appear animation, and moves focus inside.
	 */
	readonly #handleOpen = (e: Event): void => {
		const { heading, bodyTag, cardId } = (e as CustomEvent<CardOpenDetail>)
			.detail;

		this.#previousFocus = document.activeElement as HTMLElement;

		this.#titleEl.textContent = heading;

		while (this.#bodyEl.firstChild) {
			this.#bodyEl.removeChild(this.#bodyEl.firstChild);
		}
		const bodyContent = createCardBodyElement(bodyTag || undefined, "", cardId);
		if (bodyContent) {
			this.#bodyEl.appendChild(bodyContent);
		}

		this.#overlayEl.classList.add("card-modal__overlay--visible");
		this.#frameEl.classList.remove("card-modal__frame--leave");
		this.#frameEl.classList.add("card-modal__frame--appear");
		this.#frameEl.setAttribute("aria-hidden", "false");

		window.dispatchEvent(new Event("card:modal-opened"));

		requestAnimationFrame(() => {
			this.#insetEl.focus();
		});
	};

	/**
	 * Initiates the close sequence: triggers the leave animation, restores focus,
	 * and notifies the animation system to resume scroll.
	 */
	readonly #close = (): void => {
		this.#overlayEl.classList.remove("card-modal__overlay--visible");
		this.#frameEl.classList.remove("card-modal__frame--appear");
		this.#frameEl.classList.add("card-modal__frame--leave");
		this.#frameEl.setAttribute("aria-hidden", "true");

		window.dispatchEvent(new Event("card:modal-closed"));

		this.#previousFocus?.focus();
	};

	/**
	 * Fires when the inset box animation ends.
	 * Removes the leave class and clears body DOM after the exit animation completes.
	 */
	readonly #handleAnimationEnd = (): void => {
		if (!this.#frameEl.classList.contains("card-modal__frame--leave")) return;
		this.#frameEl.classList.remove("card-modal__frame--leave");
		while (this.#bodyEl.firstChild) {
			this.#bodyEl.removeChild(this.#bodyEl.firstChild);
		}
	};

	/**
	 * Closes the modal when the user clicks the dark backdrop area
	 * (i.e. directly on the frame, not on the inset box or its children).
	 */
	readonly #handleBackdropClick = (e: MouseEvent): void => {
		if (e.target === this.#frameEl) this.#close();
	};

	/**
	 * Handles keyboard events within the modal.
	 * - Escape → close
	 * - Tab / Shift+Tab → cycle focus within modal (focus trap)
	 */
	readonly #handleKeydown = (e: KeyboardEvent): void => {
		if (e.key === "Escape") {
			e.preventDefault();
			this.#close();
			return;
		}
		if (e.key !== "Tab") return;

		const focusable = Array.from(
			this.querySelectorAll<HTMLElement>(
				"button:not([disabled]), [tabindex]:not([tabindex='-1'])",
			),
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (!first || !last) return;

		const active = document.activeElement;

		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	};
}

customElements.define("card-modal", CardModal);
