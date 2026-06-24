import cssText from './career-timeline.module.css' with { type: 'text' };
import templateHtml from './career-timeline.template.html' with { type: 'text' };

/** Parsed CSS stylesheet shared across all `<career-timeline>` instances. */
const sheet: CSSStyleSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(cssText.toString());
  return s;
})();

/**
 * `<career-timeline>` — vertical accordion career and education history component.
 *
 * Renders four career stages (ECE → Zoho → Warwick → Pixel Toys) as a flex
 * column of background-image panels. Each panel shows a header (title, org,
 * period) in its collapsed state (10% of container height). On `:hover` or
 * keyboard `:focus`, the active panel expands to 70% of the container height
 * and the detail content fades in. The remaining three panels each shrink to
 * 10%. Flex expansion is driven entirely by CSS; JS only toggles `aria-hidden`
 * on the content region to keep it accessible when visually expanded.
 *
 * Under `prefers-reduced-motion: reduce`, all panels are fully visible and
 * no transitions fire.
 *
 * @customElement career-timeline
 */
class CareerTimeline extends HTMLElement {
  /** AbortController that cancels all item event listeners on disconnect. */
  #ac: AbortController | undefined = undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      templateHtml as unknown as string,
      'text/html',
    );
    Array.from(doc.body.childNodes).forEach((n) => {
      shadow.appendChild(n.cloneNode(true));
    });

    if (shadow.adoptedStyleSheets !== undefined) {
      shadow.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement('style');
      style.textContent = cssText.toString();
      shadow.appendChild(style);
    }
  }

  /** Attaches hover/focus listeners that toggle `aria-hidden` on each panel's content region. */
  connectedCallback(): void {
    this.#ac = new AbortController();
    const { signal } = this.#ac;

    const items = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(
        '.career-timeline__item',
      ) ?? [],
    );

    items.forEach((item) => {
      const content = item.querySelector<HTMLElement>(
        '.career-timeline__content',
      );
      if (!content) return;

      const reveal = (): void => {
        content.removeAttribute('aria-hidden');
      };
      const hide = (): void => {
        content.setAttribute('aria-hidden', 'true');
      };

      item.addEventListener('mouseenter', reveal, { signal });
      item.addEventListener('mouseleave', hide, { signal });
      item.addEventListener('focus', reveal, { signal });
      item.addEventListener('blur', hide, { signal });
    });
  }

  /** Aborts all item event listeners registered in {@link connectedCallback}. */
  disconnectedCallback(): void {
    this.#ac?.abort();
    this.#ac = undefined;
  }

  /** No-op: component ignores document adoption. */
  adoptedCallback(): void {}

  /** No-op: no observed attributes. */
  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {}
}

customElements.define('career-timeline', CareerTimeline);
