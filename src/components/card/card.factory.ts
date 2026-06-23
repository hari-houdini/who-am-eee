import type { Card } from "../../shared/types/card.types";

/**
 * Creates a `<hyper-card>` element populated with the given card data.
 *
 * Sets observed attributes on `<hyper-card>` for the header/footer fields.
 * Body content is determined by {@link Card.bodyTag}:
 * - `'about-me'` — appends an `<about-me>` element.
 * - `'tech-skills'` — appends a `<tech-skills>` element (technology stack grid).
 * - `'management-skills'` — appends a `<management-skills>` element (methodology grid).
 * - `'photo-gallery'` — appends a `<photo-gallery>` element (dog photo gallery).
 * - `undefined` with non-empty `content` — appends a `<div>` with parsed HTML content.
 *
 * Body elements are assigned `slot="body-content"` so they reach `<card-body>`
 * through `<hyper-card>`'s slot forwarding chain.
 *
 * @param card - Card data from {@link CARDS} constants.
 * @returns A `<hyper-card>` element ready to be inserted into the scene DOM.
 */
function createCardElement(card: Card): HTMLElement {
	const cardEl = document.createElement("hyper-card");
	cardEl.setAttribute("size", card.size);
	cardEl.setAttribute("card-id", card.id);
	cardEl.setAttribute("heading", card.title);
	cardEl.setAttribute("tags", card.tags.join(" · "));
	cardEl.setAttribute("year", card.year);

	if (card.bodyTag === "about-me") {
		const inner = document.createElement("about-me");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.bodyTag === "tech-skills") {
		const inner = document.createElement("tech-skills");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.bodyTag === "management-skills") {
		const inner = document.createElement("management-skills");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.bodyTag === "forbidden-space") {
		const inner = document.createElement("forbidden-space");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.bodyTag === "social-space") {
		const inner = document.createElement("social-space");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.bodyTag === "photo-gallery") {
		const inner = document.createElement("photo-gallery");
		inner.setAttribute("slot", "body-content");
		cardEl.appendChild(inner);
	} else if (card.content) {
		const inner = document.createElement("div");
		inner.setAttribute("slot", "body-content");
		const parser = new DOMParser();
		const doc = parser.parseFromString(card.content, "text/html");
		Array.from(doc.body.childNodes).map((n) =>
			inner.appendChild(n.cloneNode(true)),
		);
		cardEl.appendChild(inner);
	}

	return cardEl;
}

export { createCardElement };
