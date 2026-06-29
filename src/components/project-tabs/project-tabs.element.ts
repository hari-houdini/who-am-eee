import {
  PROJECT_INFO
} from "../../shared/const/project.const";
import type {
  Project
} from "../../shared/types/project.types";
import templateHtml from "./project-tabs.template.html" with {
  type: "text"
};

/**
 * SVG namespace URI required for `document.createElementNS`.
 *
 * @internal
 */
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Ring geometry constants.
 * Size matches the largest `clamp()` value in CSS (72px).
 *
 * @internal
 */
const RING_SIZE = 72;

/** @internal */
const RING_STROKE = 5;

/** @internal */
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

/** @internal */
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Builds a `<div class="project-tabs__panel">` with text content.
 * No `innerHTML` — DOM APIs only.
 *
 * @param label - Tab button label (also used as `data-tab` attribute value).
 * @param tagline - Bold first line shown only in the Description tab.
 * Pass `null` to omit the tagline element.
 * @param body - Paragraph text content.
 * @returns A fully constructed panel div.
 */
function createPanel(
  label: string,
  tagline: string | null,
  body: string,
): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("project-tabs__panel");
  div.setAttribute("data-tab", label);

  if (tagline !== null) {
    const strong = document.createElement("strong");
    strong.classList.add("project-tabs__panel-tagline");
    strong.textContent = tagline;
    div.appendChild(strong);
  }

  const p = document.createElement("p");
  p.classList.add("project-tabs__panel-text");
  p.textContent = body;
  div.appendChild(p);

  return div;
}

/**
 * `<project-tabs>` — self-contained, data-driven tab component for portfolio project cards.
 *
 * Reads the `data-project-id` attribute (e.g. `"PROJ.REPOS.001"`) and looks up
 * {@link PROJECT_INFO} to build its own panels, progress ring, and GitHub link entirely
 * in light DOM — no shadow DOM required.
 *
 * Keyboard navigation follows the WAI-ARIA tabs pattern:
 * - `ArrowLeft` / `ArrowRight` — move focus between tabs (roving tabindex)
 * - `Home` / `End` — jump to first / last tab
 * - `Tab` — exit the tablist into the active panel
 *
 * @customElement project-tabs
 */
class ProjectTabs extends HTMLElement {
  /** Panel `<div>` elements built in light DOM. */
  #panels: HTMLDivElement[] = [];

  /** Generated `<button role="tab">` elements inside the tablist. */
  #tabs: HTMLButtonElement[] = [];

  /** Zero-based index of the currently active tab. */
  #activeIndex = 0;

  /** Sliding indicator `<div>` inside the tablist. */
  #indicator: HTMLElement | null = null;

  /** The `[role="tablist"]` container. */
  #tabList: HTMLElement | null = null;

  /** Body container for panels. */
  #body: HTMLElement | null = null;

  /** Progress ring host `<div>`. */
  #ringEl: HTMLElement | null = null;

  /** Container that receives the GitHub `<a>` element built in `#loadProject`. */
  #linkSlot: HTMLElement | null = null;

  /** AbortController that cancels all event listeners on disconnect. */
  #ac: AbortController | undefined;

  /**
   * Per-instance suffix appended to ARIA id attributes to prevent collisions
   * when multiple `<project-tabs>` elements coexist on the same page.
   */
  readonly #uid = Math.random().toString(36).slice(2, 7);

  /** Observed so `attributeChangedCallback` fires when the factory sets `data-project-id`. */
  static get observedAttributes(): string[] {
    return ["data-project-id"];
  }

  constructor() {
    super();
  }

  /** Hydrates template, initialises DOM references, wires listeners, and loads project data. */
  connectedCallback(): void {
    if (this.firstChild === null) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        templateHtml as unknown as string,
        "text/html",
      );
      Array.from(doc.body.childNodes).forEach((n) => {
        this.appendChild(n.cloneNode(true));
      });
    }

    this.#tabList = this.querySelector(".project-tabs__list");
    this.#indicator = this.querySelector(".project-tabs__indicator");
    this.#body = this.querySelector(".project-tabs__body");
    this.#ringEl = this.querySelector(".project-tabs__progress-ring");
    this.#linkSlot = this.querySelector(".project-tabs__link-slot");

    this.#ac = new AbortController();
    this.#loadProject(this.dataset.projectId ? ? "");
  }

  /** Aborts all event listeners registered during {@link connectedCallback}. */
  disconnectedCallback(): void {
    this.#ac?.abort();
    this.#ac = undefined;
  }

  /** No-op: component ignores document adoption. */
  adoptedCallback(): void {}

  /**
   * Reloads project content when the `data-project-id` attribute changes at runtime.
   *
   * @param _name - Attribute name (always `"data-project-id"`).
   * @param _oldValue - Previous attribute value.
   * @param newValue - New attribute value; used as the project lookup key.
   */
  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (this.isConnected) {
      this.#loadProject(newValue ? ? "");
    }
  }

  /**
   * Looks up `PROJECT_INFO[id]`, builds progress ring, GitHub link, and
   * three tab panels (Description / Learnings / Goals), then activates tab 0.
   *
   * @param id - Card ID key into {@link PROJECT_INFO} (e.g. `"PROJ.REPOS.001"`).
   */
  #loadProject(id: string): void {
    const info: Project | undefined = PROJECT_INFO[id];
    if (!info) return;

    this.#buildProgressRing(info.progress);
    this.#buildLink(info.url);
    this.#buildPanels(info);
    this.#buildTabs();
    this.#activate(0, false);
  }

  /**
   * Builds or replaces the "View on GitHub" anchor inside `#linkSlot`.
   * Creates the element fresh each call so `href` is always up-to-date.
   *
   * @param url - GitHub repository URL from {@link PROJECT_INFO}.
   */
  #buildLink(url: string): void {
    if (!this.#linkSlot) return;
    while (this.#linkSlot.firstChild) {
      this.#linkSlot.removeChild(this.#linkSlot.firstChild);
    }
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.classList.add("project-tabs__link");
    a.textContent = "View on GitHub ↗";
    this.#linkSlot.appendChild(a);
  }

  /**
   * Constructs the SVG progress ring and percentage label inside `#ringEl`.
   * Uses `createElementNS` — no `innerHTML`.
   *
   * @param progress - Integer 0–100 representing project completion.
   */
  #buildProgressRing(progress: number): void {
    if (!this.#ringEl) return;

    while (this.#ringEl.firstChild) {
      this.#ringEl.removeChild(this.#ringEl.firstChild);
    }

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${RING_SIZE} ${RING_SIZE}`);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("project-tabs__ring");

    const track = document.createElementNS(SVG_NS, "circle");
    track.setAttribute("cx", String(RING_SIZE / 2));
    track.setAttribute("cy", String(RING_SIZE / 2));
    track.setAttribute("r", String(RING_RADIUS));
    track.setAttribute("stroke-width", String(RING_STROKE));
    track.classList.add("project-tabs__ring-track");

    const arc = document.createElementNS(SVG_NS, "circle");
    arc.setAttribute("cx", String(RING_SIZE / 2));
    arc.setAttribute("cy", String(RING_SIZE / 2));
    arc.setAttribute("r", String(RING_RADIUS));
    arc.setAttribute("stroke-width", String(RING_STROKE));
    arc.setAttribute(
      "transform",
      `rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`,
    );
    arc.setAttribute("stroke-dasharray", String(RING_CIRCUMFERENCE));
    arc.setAttribute("stroke-dashoffset", String(RING_CIRCUMFERENCE));
    arc.classList.add("project-tabs__ring-arc");

    svg.appendChild(track);
    svg.appendChild(arc);
    this.#ringEl.appendChild(svg);

    const label = document.createElement("span");
    label.classList.add("project-tabs__ring-label");
    label.textContent = `${progress}%`;
    this.#ringEl.appendChild(label);

    this.#ringEl.setAttribute("aria-valuenow", String(progress));
    this.#ringEl.setAttribute("aria-label", `Project progress: ${progress}%`);

    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finalOffset =
      RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;

    if (reducedMotion) {
      arc.style.strokeDashoffset = String(finalOffset);
    } else {
      requestAnimationFrame(() => {
        arc.style.strokeDashoffset = String(finalOffset);
      });
    }
  }

  /**
   * Clears the body container and appends three panels built from `info`.
   *
   * @param info - Project data from {@link PROJECT_INFO}.
   */
  #buildPanels(info: Project): void {
    if (!this.#body) return;

    while (this.#body.firstChild) {
      this.#body.removeChild(this.#body.firstChild);
    }

    this.#panels = [
      createPanel("Description", info.tagline, info.description),
      createPanel("Learnings", null, info.learnings),
      createPanel("Goals", null, info.aim),
    ];

    for (const panel of this.#panels) {
      this.#body.appendChild(panel);
    }
  }

  /**
   * Generates one `<button role="tab">` per panel and stamps ARIA identity
   * attributes (`id`, `role`, `aria-labelledby`, `tabindex`) onto both the
   * button and its corresponding panel element.
   */
  #buildTabs(): void {
    if (!this.#tabList || !this.#ac) return;
    this.#tabs = [];

    for (const b of Array.from(
        this.#tabList.querySelectorAll < HTMLElement > (".project-tabs__tab"),
      )) {
      b.remove();
    }

    const {
      signal
    } = this.#ac;

    this.#panels.forEach((panel, i) => {
      const label = panel.getAttribute("data-tab") ? ? `Tab $i + 1`;
      const tabId = `pt-tab-$this.#uid-$i`;
      const panelId = `pt-panel-$this.#uid-$i`;

      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      panel.setAttribute("tabindex", "0");

      const btn = document.createElement("button");
      btn.id = tabId;
      btn.setAttribute("role", "tab");
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1");
      btn.textContent = label;
      btn.classList.add("project-tabs__tab");

      btn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          this.#activate(i);
        }, {
          signal
        },
      );
      btn.addEventListener(
        "keydown",
        (e) => {
          e.stopPropagation();
          this.#onKeyDown(e, i);
        }, {
          signal
        },
      );

      this.#tabList ? .insertBefore(btn, this.#indicator);
      this.#tabs.push(btn);
    });
  }

  /**
   * Activates the tab at `index`: updates ARIA states on buttons, toggles
   * the active CSS class on panels, and repositions the indicator bar.
   *
   * @param index - Zero-based index of the tab to activate.
   * @param animate - `false` suppresses the indicator CSS transition (initial render).
   */
  #activate(index: number, animate = true): void {
    this.#activeIndex = index;

    this.#tabs.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute("aria-selected", String(active));
      btn.setAttribute("tabindex", active ? "0" : "-1");
      btn.classList.toggle("project-tabs__tab--active", active);
    });

    this.#panels.forEach((panel, i) => {
      panel.classList.toggle("project-tabs__panel--active", i === index);
    });

    this.#moveIndicator(animate);
  }

  /**
   * Repositions the sliding indicator to sit under the active tab button.
   * Uses `transform: translateX scaleX` exclusively — compositor-only path.
   *
   * When `tabList.offsetWidth` is 0 (element not yet laid out), retries on the
   * next animation frame so the indicator appears correctly on first open.
   *
   * @param animate - When `false`, bypasses the CSS transition for one frame
   * so the indicator jumps to position without animating on first render.
   */
  #moveIndicator(animate: boolean): void {
    const indicator = this.#indicator;
    const tabList = this.#tabList;
    const activeTab = this.#tabs[this.#activeIndex];
    if (!indicator || !tabList || !activeTab) return;

    const doMove = (): void => {
      const totalWidth = tabList.offsetWidth;
      if (totalWidth === 0) {
        requestAnimationFrame(doMove);
        return;
      }
      const left = activeTab.offsetLeft;
      const width = activeTab.offsetWidth;
      indicator.style.transform = `translateX(${left}px) scaleX(${width / totalWidth})`;
    };

    if (!animate) {
      indicator.style.transition = "none";
      requestAnimationFrame(() => {
        doMove();
        requestAnimationFrame(() => {
          indicator.style.transition = "";
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
   * @param e - Keyboard event from the focused tab button.
   * @param currentIndex - Index of the tab button that received the event.
   */
  #onKeyDown(e: KeyboardEvent, currentIndex: number): void {
    const count = this.#tabs.length;
    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % count;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.#activate(nextIndex);
    this.#tabs[nextIndex] ? .focus();
  }
}

customElements.define("project-tabs", ProjectTabs);