import Lenis from 'lenis';
import {
  CARDS,
  INITIAL_SPACE_STATE,
  LABELS,
  SPACE_CONFIG,
} from './hyper.const';
import type { Card } from './hyper.types';

/**
 * Builds a fully structured card DOM element without using `innerHTML`.
 *
 * Card body content (`card.content`) is an internal HTML string; it is
 * safely parsed via `DOMParser` and deep-cloned into the content container.
 *
 * @param card - Data for the card to render.
 * @returns A `<div class="card card--{size}">` element ready to be inserted.
 */
function createCardElement(card: Card): HTMLDivElement {
  const cardEl = document.createElement('div');
  cardEl.classList.add('card', `card--${card.size}`);

  const header = document.createElement('div');
  header.className = 'card__header';

  const idSpan = document.createElement('span');
  idSpan.className = 'card__id';
  idSpan.textContent = card.id;

  const arrowSpan = document.createElement('span');
  arrowSpan.textContent = '↗';

  header.appendChild(idSpan);
  header.appendChild(arrowSpan);

  const heading = document.createElement('h2');
  heading.className = 'card__heading';
  heading.textContent = card.title;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'card__content';
  const parser = new DOMParser();
  const doc = parser.parseFromString(card.content, 'text/html');
  Array.from(doc.body.childNodes).map((n) =>
    contentDiv.appendChild(n.cloneNode(true)),
  );

  const footer = document.createElement('div');
  footer.className = 'card__footer';

  const tagsSpan = document.createElement('span');
  tagsSpan.textContent = card.tags.join(' · ');
  tagsSpan.className = 'card__tags';

  const yearSpan = document.createElement('span');
  yearSpan.textContent = card.year;
  yearSpan.className = 'card__year';

  footer.appendChild(tagsSpan);
  footer.appendChild(yearSpan);

  cardEl.appendChild(header);
  cardEl.appendChild(heading);
  cardEl.appendChild(contentDiv);
  cardEl.appendChild(footer);

  return cardEl;
}

/**
 * Populates the `#world` element with all scene items:
 * randomly distributed star particles, section text labels, and portfolio cards.
 *
 * Items are assigned `data-*` attributes consumed each frame by {@link rafLoop}.
 * Stars are distributed randomly across the full scene volume; labels and cards
 * are placed at evenly-spaced Z intervals defined by {@link SpaceConfig.zGap}.
 *
 * @param world - The container element to populate (the `#world` div inside Shadow DOM).
 */
function initWorld(world: HTMLElement): void {
  for (let i = 0; i < SPACE_CONFIG.starCount; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'section__item';
    wrapper.dataset.animElement = '';
    wrapper.dataset.type = 'star';
    wrapper.dataset.x = String((Math.random() - 0.5) * 4000);
    wrapper.dataset.y = String((Math.random() - 0.5) * 4000);
    wrapper.dataset.z = String(
      -Math.random() * SPACE_CONFIG.loopSize,
    );
    wrapper.dataset.rotation = '0';
    const dot = document.createElement('div');
    dot.className = 'star';
    wrapper.appendChild(dot);
    world.appendChild(wrapper);
  }

  let zIndex = -200;

  Object.entries(LABELS).forEach(([key, { text, description }]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'section__item';
    wrapper.dataset.animElement = '';
    wrapper.dataset.type = 'text';
    wrapper.dataset.x = '0';
    wrapper.dataset.y = '0';
    wrapper.dataset.z = String(zIndex);
    wrapper.dataset.rotation = '0';

    const inner = document.createElement('div');
    inner.className = 'section__item--title';
    inner.textContent = text;

    if (description) {
      const descriptionEl = document.createElement('div');
      descriptionEl.className = 'section__item--tagline';
      descriptionEl.textContent = description;
      inner.appendChild(descriptionEl);
    }

    wrapper.appendChild(inner);
    world.appendChild(wrapper);

    zIndex -= SPACE_CONFIG.zGap;

    const cards = CARDS[key] ?? [];

    cards.forEach((card) => {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'section__item';
      cardWrapper.dataset.animElement = '';
      cardWrapper.dataset.type = 'card';
      cardWrapper.dataset.x = String(card.x ?? 0);
      cardWrapper.dataset.y = String(card.y ?? 0);
      cardWrapper.dataset.z = String(zIndex);
      cardWrapper.dataset.rotation = String(card.rotation ?? 0);

      zIndex -= SPACE_CONFIG.zGap;

      cardWrapper.appendChild(createCardElement(card));
      world.appendChild(cardWrapper);
    });
  });
}

/**
 * Entry point called from the `<hyper-space>` element's `connectedCallback`.
 *
 * Initialises the scene DOM via {@link initWorld}, creates a Lenis smooth-scroll
 * instance, registers scroll and mouse listeners that update shared state, then
 * delegates the per-frame rendering to {@link rafLoop}.
 *
 * @param context - The `<hyper-space>` custom element. Its Shadow DOM must
 *   already be attached and must contain a `#world` element.
 */
function loadHyperSpaceAnimation(context: HTMLElement): void {
  if (!context.shadowRoot) return;

  const state = { ...INITIAL_SPACE_STATE };

  const world = context.shadowRoot.getElementById('world');

  if (!world) return;

  initWorld(world);

  const lenis = new Lenis({
    lerp: 0.08,
    syncTouch: true,
  });

  lenis.on(
    'scroll',
    ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      state.scroll = scroll;
      state.targetSpeed = velocity;
    },
  );

  window.addEventListener('mousemove', (e: MouseEvent) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  rafLoop(lenis, state, context.shadowRoot);
}

/**
 * Runs the per-frame animation loop for the hyper-space scene.
 *
 * Each frame:
 * 1. Calls `lenis.raf(time)` for smooth-scroll integration.
 * 2. Smooths `state.velocity` toward `state.targetSpeed` via lerp.
 * 3. Applies camera tilt from mouse position and scroll speed (skipped under
 *    `prefers-reduced-motion: reduce`).
 * 4. Adjusts perspective (FOV warp) based on speed (also skipped under reduce).
 * 5. Positions every scene item along the Z axis with depth-looping and opacity fade.
 *
 * All visual mutations use only `transform` and `opacity` (compositor path, 60 fps).
 *
 * @param lenis - The Lenis smooth-scroll instance owning the RAF clock.
 * @param state - Mutable scene state mutated by scroll and mouse listeners.
 * @param root - Shadow root of the `<hyper-space>` element.
 */
function rafLoop(
  lenis: Lenis,
  state: typeof INITIAL_SPACE_STATE,
  root: ShadowRoot,
): void {
  const world = root.getElementById('world');
  const viewport = root.getElementById('viewport');

  if (!world || !viewport) return;

  const worldEl: HTMLElement = world;
  const viewportEl: HTMLElement = viewport;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const animElements = Array.from<HTMLElement>(
    root.querySelectorAll('[data-anim-element]'),
  );

  const items = animElements.map((el) => ({
    el,
    type: el.dataset.type,
    x: Number(el.dataset.x ?? '0'),
    y: Number(el.dataset.y ?? '0'),
    baseZ: Number(el.dataset.z ?? '0'),
    rotation: Number(el.dataset.rotation ?? '0'),
  }));

  /** Inner RAF callback — scheduled recursively via `requestAnimationFrame`. */
  function raf(time: number): void {
    lenis.raf(time);
    window.requestAnimationFrame(raf);

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    if (!reduceMotion.matches) {
      const tiltX = state.mouseY * 5 - state.velocity * 0.5;
      const tiltY = state.mouseX * 5;
      worldEl.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

      const baseFov = 1000;
      const fov =
        baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
      viewportEl.style.perspective = `${fov}px`;
    }

    const cameraZ = state.scroll * SPACE_CONFIG.camSpeed;
    const modC = SPACE_CONFIG.loopSize;

    items.forEach((item) => {
      const relZ = item.baseZ + cameraZ;
      let vizZ = ((relZ % modC) + modC) % modC;
      if (vizZ > 1000) vizZ -= modC;

      let alpha = 1;
      if (vizZ < -3000) alpha = 0;
      else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;

      if (vizZ > 100 && item.type !== 'star') {
        alpha = 1 - (vizZ - 100) / 400;
      }

      if (alpha <= 0) {
        item.el.style.opacity = '0';
        item.el.style.display = 'none';
        return;
      }

      item.el.style.opacity = String(alpha);
      item.el.style.display = 'flex';

      let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

      switch (item.type) {
        case 'star': {
          if (!reduceMotion.matches) {
            const stretch = Math.max(
              1,
              Math.min(1 + Math.abs(state.velocity) * 0.1, 10),
            );
            trans += ` scale3d(1, 1, ${stretch})`;
          }
          break;
        }
        case 'text': {
          trans += ` rotateZ(${item.rotation}deg)`;

          if (!reduceMotion.matches) {
            const transX =
              (-state.mouseX / (state.mouseX + 50)) * 100;
            const transY =
              (-state.mouseY / (state.mouseY + 50)) * 100;

            const titleEl = item.el.querySelector<HTMLElement>(
              '.section__item--title',
            );
            if (titleEl) {
              titleEl.style.backgroundPosition = `${transX}% ${transY}%`;
            }

            if (Math.abs(state.velocity) > 1) {
              const offset = state.velocity * 2;
              item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
            } else {
              item.el.style.textShadow = 'none';
            }
          }
          break;
        }
        default: {
          if (!reduceMotion.matches) {
            const t = time * 0.001;
            const float = Math.sin(t + item.x) * 10;
            trans += ` rotateZ(${item.rotation}deg) rotateY(${float}deg)`;
          } else {
            trans += ` rotateZ(${item.rotation}deg)`;
          }
          break;
        }
      }

      item.el.style.transform = trans;
    });
  }

  window.requestAnimationFrame(raf);
}

export { loadHyperSpaceAnimation };
