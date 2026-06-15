customElements.define(
  'terminal-window',
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.createElement('template');
      const templateContent = template.content;

      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(
        document.importNode(templateContent, true),
      );
    }
  },
);
