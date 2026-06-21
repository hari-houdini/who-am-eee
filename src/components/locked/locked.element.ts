import cssText from './locked.module.css' with { type: 'text' };
import templateHtml from './locked.template.html' with { type: 'text' };

/** Parsed CSS stylesheet shared across all `<forbidden-space>` instances. */
const sheet: CSSStyleSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(cssText.toString());
  return s;
})();

/**
 * `<forbidden-space>` — self-contained component, to hide content.
 * No observed attributes or consumer-facing slots — fully self-contained.
 *
 * @customElement forbidden-space
 */
class ForbiddenSpace extends HTMLElement {
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

  /** No-op: component is fully static, no setup needed on connection. */
  connectedCallback(): void {}

  /** No-op: no listeners or RAF loops to clean up. */
  disconnectedCallback(): void {}

  /** No-op: component ignores document adoption. */
  adoptedCallback(): void {}

  /** No-op: no observed attributes. */
  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {}
}

customElements.define('forbidden-space', ForbiddenSpace);
