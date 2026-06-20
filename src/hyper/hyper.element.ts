import loadHyperSpaceAnimation from './hyper.animation';
import hyperSpaceStyles from './hyper.module.css' with { type: 'text' };
import hyperSpaceTemplate from './hyper.template.html' with { type: 'text' };

class HyperSpaceWindow extends HTMLElement {
  constructor() {
    super();
    console.log('Hyper space window element created.');
    const template = document.createElement('template');
    template.innerHTML = String(hyperSpaceTemplate);

    if (template instanceof HTMLTemplateElement) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      const stylesheet = new CSSStyleSheet();
      stylesheet.replaceSync(hyperSpaceStyles.toString());
      shadowRoot.adoptedStyleSheets = [stylesheet];
      shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      console.error(
        'Template element not found or is not a <template>',
      );
    }
  }

  connectedCallback() {
    console.log('Hyper space window element added to page.');
    loadHyperSpaceAnimation(this);
  }

  disconnectedCallback() {
    console.log('Hyper space window element removed from page.');
  }

  adoptedCallback() {
    console.log('Hyper space window element moved to new page.');
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ) {
    console.log(
      'Hyper space window element attributes changed.',
      name,
      oldValue,
      newValue,
    );
  }
}

customElements.define('hyper-space', HyperSpaceWindow);
