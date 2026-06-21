import type { Card } from '../../shared/types/card.types';

/**
 * Creates a `<hyper-card>` element populated with the given card data.
 *
 * Sets observed attributes on `<hyper-card>` for the header/footer fields.
 * Body content is determined by {@link Card.bodyTag}:
 * - `'about-me'` — appends an `<about-me>` element.
 * - `'hyper-cells'` — appends a `<hyper-cells>` element with parsed child nodes
 *   from `card.content` (expected to contain `<hyper-cell>` elements).
 * - `undefined` with non-empty `content` — appends a `<div>` with parsed HTML content.
 *
 * Body elements are assigned `slot="body-content"` so they reach `<card-body>`
 * through `<hyper-card>`'s slot forwarding chain.
 *
 * @param card - Card data from {@link CARDS} constants.
 * @returns A `<hyper-card>` element ready to be inserted into the scene DOM.
 */
function createCardElement(card: Card): HTMLElement {
  const cardEl = document.createElement('hyper-card');
  cardEl.setAttribute('size', card.size);
  cardEl.setAttribute('card-id', card.id);
  cardEl.setAttribute('heading', card.title);
  cardEl.setAttribute('tags', card.tags.join(' · '));
  cardEl.setAttribute('year', card.year);

  if (card.bodyTag === 'about-me') {
    const inner = document.createElement('about-me');
    inner.setAttribute('slot', 'body-content');
    cardEl.appendChild(inner);
  } else if (card.bodyTag === 'hyper-cells') {
    const cells = document.createElement('hyper-cells');
    cells.setAttribute('slot', 'body-content');
    const parser = new DOMParser();
    const doc = parser.parseFromString(card.content, 'text/html');
    Array.from(doc.body.childNodes).map((n) =>
      cells.appendChild(n.cloneNode(true)),
    );
    cardEl.appendChild(cells);
  } else if (card.content) {
    const inner = document.createElement('div');
    inner.setAttribute('slot', 'body-content');
    const parser = new DOMParser();
    const doc = parser.parseFromString(card.content, 'text/html');
    Array.from(doc.body.childNodes).map((n) =>
      inner.appendChild(n.cloneNode(true)),
    );
    cardEl.appendChild(inner);
  }

  return cardEl;
}

export { createCardElement };
