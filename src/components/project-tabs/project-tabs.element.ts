import { adoptStyles } from '../../shared/utils/adopt-styles.utils';
import cssText from './project-tabs.module.css' with { type: 'text' };
import templateHtml from './project-tabs.template.html' with { type: 'text' };

/** Parsed CSS stylesheet shared across all `<project-tabs>` instances. */
const sheet: CSSStyleSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(cssText.toString());
  return s;
})();

/**
 * `<project-tabs>` — keyboard-accessible tab panel for project content.
 *
 * Consumer provides tab panels as direct light-DOM children, each carrying a
 * `data-tab` attribute whose value becomes the tab button label:
 *
 * ```html
 * <project-tabs>
 *   <div data-tab="Overview">Overview content…</div>
 *   <div data-tab="Tech Stack">Tech stack content…</div>
 * </project-tabs>
 * ```
 *
 * Keyboard navigation follows the WAI-ARIA tabs pattern:
 * - `ArrowLeft` / `ArrowRight` — move focus between tabs (roving tabindex)
 * - `Home` / `End` — jump to first / last tab
 * - `Tab` — exit the tablist into the active panel
 *
 * @customElement project-tabs
 */
class ProjectTabs extends HTMLElement {
  /** All light-DOM panel elements carrying a `data-tab` attribute. */
  #panels: HTMLElement[] = [];

  /** Generated `<button role="tab">` elements inside the shadow tablist. */
  #tabs: HTMLButtonElement[] = [];

  /** Zero-based index of the currently active tab. */
  #activeIndex = 0;

  /** Sliding cyan indicator `<div>` inside the tablist. */
  #indicator: HTMLElement | null = null;

  /** The shadow `[role="tablist"]` container element. */
  #tabList: HTMLElement | null = null;

  /** AbortController that cancels all event listeners on disconnect. */
  #ac: AbortController | undefined;

  /**
   * Per-instance suffix appended to ARIA id attributes to prevent collisions
   * when multiple `<project-tabs>` elements coexist on the same page.
   */
  readonly #uid = Math.random().toString(36).slice(2, 7);

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

    adoptStyles(shadow, sheet, cssText.toString());

    this.#tabList = shadow.querySelector('.project-tabs__list');
    this.#indicator = shadow.querySelector(
      '.project-tabs__indicator',
    );
  }

  /** Discovers panels, builds tab buttons, and wires the slot-change listener. */
  connectedCallback(): void {
    this.#ac = new AbortController();
    const { signal } = this.#ac;

    this.shadowRoot
      ?.querySelector('slot')
      ?.addEventListener('slotchange', () => this.#rebuild(), {
        signal,
      });

    this.#rebuild();
  }

  /** Aborts all event listeners registered during {@link connectedCallback}. */
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

  /**
   * Re-collects panels from light DOM, regenerates tab buttons, and resets
   * to the first tab. Called on connect and on `slotchange`.
   */
  #rebuild(): void {
    this.#panels = Array.from(this.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.hasAttribute('data-tab'),
    );
    this.#buildTabs();
    this.#activate(0, false);
  }

  /**
   * Generates one `<button role="tab">` per panel and stamps ARIA identity
   * attributes (`id`, `role`, `aria-labelledby`, `tabindex`) onto both the
   * button and its corresponding light-DOM panel element.
   */
  #buildTabs(): void {
    if (!this.#tabList || !this.#ac) return;
    this.#tabs = [];

    for (const b of Array.from(
      this.#tabList.querySelectorAll<HTMLElement>(
        '.project-tabs__tab',
      ),
    )) {
      b.remove();
    }

    const { signal } = this.#ac;

    this.#panels.forEach((panel, i) => {
      const label = panel.getAttribute('data-tab') ?? `Tab ${i + 1}`;
      const tabId = `pt-tab-${this.#uid}-${i}`;
      const panelId = `pt-panel-${this.#uid}-${i}`;

      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);
      panel.setAttribute('tabindex', '0');

      const btn = document.createElement('button');
      btn.id = tabId;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
      btn.textContent = label;
      btn.classList.add('project-tabs__tab');

      btn.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          this.#activate(i);
        },
        { signal },
      );
      btn.addEventListener('keydown', (e) => this.#onKeyDown(e, i), {
        signal,
      });

      this.#tabList?.insertBefore(btn, this.#indicator);
      this.#tabs.push(btn);
    });
  }

  /**
   * Activates the tab at `index`: updates ARIA states on buttons, toggles
   * the active CSS class on panels, and repositions the indicator bar.
   *
   * @param index   - Zero-based index of the tab to activate.
   * @param animate - `false` suppresses the indicator CSS transition (initial render).
   */
  #activate(index: number, animate = true): void {
    this.#activeIndex = index;

    this.#tabs.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', String(active));
      btn.setAttribute('tabindex', active ? '0' : '-1');
      btn.classList.toggle('project-tabs__tab--active', active);
    });

    this.#panels.forEach((panel, i) => {
      panel.classList.toggle(
        'project-tabs__panel--active',
        i === index,
      );
    });

    this.#moveIndicator(animate);
  }

  /**
   * Repositions the sliding indicator to sit under the active tab button.
   * Uses `transform: translateX scaleX` exclusively — compositor-only path,
   * no layout properties animated.
   *
   * The indicator is 100% of the tablist width; `scaleX` compresses it to
   * the active tab's width. `transform-origin: left center` ensures it
   * scales from the left edge before the `translateX` offset is applied.
   *
   * @param animate - When `false`, bypasses the CSS transition for one frame
   *   so the indicator jumps to position without animating on first render.
   */
  #moveIndicator(animate: boolean): void {
    const indicator = this.#indicator;
    const tabList = this.#tabList;
    const activeTab = this.#tabs[this.#activeIndex];
    if (!indicator || !tabList || !activeTab) return;

    const doMove = (): void => {
      const totalWidth = tabList.offsetWidth;
      if (totalWidth === 0) return;
      const left = activeTab.offsetLeft;
      const width = activeTab.offsetWidth;
      indicator.style.transform = `translateX(${left}px) scaleX(${width / totalWidth})`;
    };

    if (!animate) {
      indicator.style.transition = 'none';
      requestAnimationFrame(() => {
        doMove();
        requestAnimationFrame(() => {
          indicator.style.transition = '';
        });
      });
    } else {
      doMove();
    }
  }

  /**
   * Handles keyboard navigation inside the tablist (roving tabindex pattern).
   * Arrow keys wrap around; `Home`/`End` jump to the first/last tab.
   *
   * @param e            - Keyboard event from the focused tab button.
   * @param currentIndex - Index of the tab button that received the event.
   */
  #onKeyDown(e: KeyboardEvent, currentIndex: number): void {
    const count = this.#tabs.length;
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % count;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.#activate(nextIndex);
    this.#tabs[nextIndex]?.focus();
  }
}

customElements.define('project-tabs', ProjectTabs);
