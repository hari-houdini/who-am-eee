/**
 * Creates the appropriate body `HTMLElement` for a card, given its `bodyTag` and
 * raw HTML `content` string. Used by both `card.factory.ts` (card scene rendering)
 * and `card-modal.element.ts` (modal body population).
 *
 * The element is returned without a `slot` attribute — callers set that as needed.
 *
 * @param bodyTag - Custom element tag name (e.g. `'about-me'`, `'tech-skills'`).
 *   Pass `undefined` or an empty string to fall back to `content`.
 * @param content - Raw HTML string parsed via `DOMParser` when `bodyTag` is absent.
 * @param cardId - The originating card's `id` attribute (e.g. `'PROJ.REPOS.001'`).
 *   Forwarded to self-contained components like `<project-tabs>` via `dataset.projectId`.
 * @returns The constructed `HTMLElement`, or `null` when both inputs are empty.
 */
function createCardBodyElement(
  bodyTag: string | undefined,
  content: string,
  cardId = '',
): HTMLElement | null {
  if (bodyTag === 'about-me') {
    return document.createElement('about-me');
  }
  if (bodyTag === 'tech-skills') {
    return document.createElement('tech-skills');
  }
  if (bodyTag === 'management-skills') {
    return document.createElement('management-skills');
  }
  if (bodyTag === 'forbidden-space') {
    return document.createElement('forbidden-space');
  }
  if (bodyTag === 'social-space') {
    return document.createElement('social-space');
  }
  // if (bodyTag === "photo-gallery") {
  // 	return document.createElement("photo-gallery");
  // }
  if (bodyTag === 'career-timeline') {
    return document.createElement('career-timeline');
  }
  if (bodyTag === 'project-tabs') {
    const el = document.createElement('project-tabs');
    if (cardId) el.dataset.projectId = cardId;
    return el;
  }
  if (content) {
    const div = document.createElement('div');
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    Array.from(doc.body.childNodes).forEach((n) => {
      div.appendChild(n.cloneNode(true));
    });
    return div;
  }
  return null;
}

export { createCardBodyElement };
