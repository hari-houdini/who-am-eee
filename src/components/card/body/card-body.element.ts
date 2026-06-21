import cssText from './card-body.module.css' with { type: 'text' };
import templateHtml from './card-body.template.html' with { type: 'text' };

/** Parsed CSS stylesheet shared across all `<card-body>` instances. */
const sheet: CSSStyleSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(cssText.toString());
  return s;
})();

/**
 * `<card-body>` — renders a card heading and a named slot for body content.
 *
 * Observed attribute `heading` populates the `.card-body__heading` element.
 * The `body-content` named slot accepts consumer-supplied content (e.g.
 * `<about-me>` or `<hyper-cells>`).
 *
 * @customElement card-body
 */
class CardBody extends HTMLElement {
  /** Attributes that trigger {@link attributeChangedCallback}. */
  static get observedAttributes(): string[] {
    return ['heading'];
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
   * @param name - The changed attribute name.
   * @param _oldValue - Previous attribute value (unused).
   * @param newValue - New attribute value to apply.
   */
  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === 'heading') {
      const headingEl = this.shadowRoot?.querySelector<HTMLElement>(
        '.card-body__heading',
      );
      if (headingEl) {
        headingEl.textContent = newValue ?? '';
      }
    }
  }
}

customElements.define('card-body', CardBody);
