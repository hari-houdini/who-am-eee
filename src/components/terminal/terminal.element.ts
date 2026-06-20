import sheet from './terminal.module.css' with { type: 'text' };
import terminalTemplate from './terminal.template.html' with { type: 'text' };

/**
 * `<terminal-window>` custom element.
 *
 * Renders a retro terminal UI with a title bar, cursor, and a Win98-style
 * error dialog. The template is imported as an HTML string and parsed via
 * `DOMParser` to comply with the project's DOM-safety policy.
 *
 * @customElement terminal-window
 */
class TerminalWindow extends HTMLElement {
  constructor() {
    super();

    const parser = new DOMParser();
    const parsed = parser.parseFromString(
      terminalTemplate as unknown as string,
      'text/html',
    );
    const template = document.createElement('template');
    Array.from(parsed.body.childNodes).map((node) =>
      template.content.appendChild(node.cloneNode(true)),
    );

    const shadowRoot = this.attachShadow({ mode: 'open' });
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(sheet.toString());
    shadowRoot.adoptedStyleSheets = [stylesheet];
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  /** No action required on connection for this element. */
  connectedCallback(): void {
    // No-op.
  }

  /** No action required on disconnection for this element. */
  disconnectedCallback(): void {
    // No-op.
  }

  /** No action required when the element is adopted into a new document. */
  adoptedCallback(): void {
    // No-op.
  }

  /**
   * Responds to observed attribute changes.
   *
   * @param name - Attribute name that changed.
   * @param oldValue - Previous value, or `null` if the attribute was not set.
   * @param newValue - New value, or `null` if the attribute was removed.
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    // No observed attributes are currently defined.
    void name;
    void oldValue;
    void newValue;
  }
}

customElements.define('terminal-window', TerminalWindow);
