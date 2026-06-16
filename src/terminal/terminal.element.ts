import sheet from './terminal.module.css' with { type: 'text' };

class TerminalWindow extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById(
      'terminal-window-template',
    );

    if (template instanceof HTMLTemplateElement) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      const stylesheet = new CSSStyleSheet();
      stylesheet.replaceSync(sheet.toString());
      shadowRoot.adoptedStyleSheets = [stylesheet];
      shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      console.error(
        'Template element not found or is not a <template>',
      );
    }
  }

  connectedCallback() {
    console.log('Terminal window element added to page.');
  }

  disconnectedCallback() {
    console.log('Terminal window element removed from page.');
  }

  adoptedCallback() {
    console.log('Terminal window element moved to new page.');
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ) {
    console.log(
      'Terminal window element attributes changed.',
      name,
      oldValue,
      newValue,
    );
  }
}

customElements.define('terminal-window', TerminalWindow);
