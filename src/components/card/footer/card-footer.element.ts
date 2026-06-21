import cssText from './card-footer.module.css' with { type: 'text' };
import templateHtml from './card-footer.template.html' with { type: 'text' };

/** Parsed CSS stylesheet shared across all `<card-footer>` instances. */
const sheet: CSSStyleSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(cssText.toString());
  return s;
})();

/**
 * `<card-footer>` — renders the tags and year fields at the base of a card.
 *
 * Observed attributes `tags` and `year` populate their respective spans.
 * Set by the parent `<hyper-card>` during `connectedCallback`.
 *
 * @customElement card-footer
 */
class CardFooter extends HTMLElement {
  /** Attributes that trigger {@link attributeChangedCallback}. */
  static get observedAttributes(): string[] {
    return ['tags', 'year'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      templateHtml as unknown as string,
      'text/html',
    );
    Array.from(doc.body.childNodes).map((n) =>
      shadow.appendChild(n.cloneNode(true)),
    );

    if (shadow.adoptedStyleSheets !== undefined) {
      shadow.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement('style');
      style.textContent = cssText.toString();
      shadow.appendChild(style);
    }
  }

  /** No-op: attribute-driven component, no DOM side-effects on connect. */
  connectedCallback(): void {}

  /** No-op: no listeners to detach. */
  disconnectedCallback(): void {}

  /** No-op: no document-adoption behaviour. */
  adoptedCallback(): void {}

  /**
   * Syncs observed attribute changes to the shadow DOM.
   *
   * @param name - The changed attribute name (`'tags'` or `'year'`).
   * @param _oldValue - Previous attribute value (unused).
   * @param newValue - New attribute value to apply.
   */
  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === 'tags') {
      const tagsEl = this.shadowRoot?.querySelector<HTMLElement>(
        '.card-footer__tags',
      );
      if (tagsEl) tagsEl.textContent = newValue ?? '';
    } else if (name === 'year') {
      const yearEl = this.shadowRoot?.querySelector<HTMLElement>(
        '.card-footer__year',
      );
      if (yearEl) yearEl.textContent = newValue ?? '';
    }
  }
}

customElements.define('card-footer', CardFooter);
