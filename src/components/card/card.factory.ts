import type { Card } from "../../shared/types/card.types";
import { createCardBodyElement } from "../../shared/utils/card-body.factory";

/**
 * Creates a `<hyper-card>` element populated with the given card data.
 *
 * Sets observed attributes on `<hyper-card>` for the header/footer fields, and the
 * `body-tag` data attribute so the card can forward it to `<card-modal>` on click.
 * When {@link Card.modal} is `true`, a `modal` attribute is also added so that
 * `<hyper-card>` and `<card-header>` apply modal-specific styles and interaction.
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
	cardEl.setAttribute("body-tag", card.bodyTag ?? "");

	if (card.modal) {
		cardEl.setAttribute("modal", "");
	}

	const bodyContent = createCardBodyElement(
		card.bodyTag,
		card.content,
		card.id,
	);
	if (bodyContent) {
		bodyContent.setAttribute("slot", "body-content");
		cardEl.appendChild(bodyContent);
	}

	return cardEl;
}

export { createCardElement };
