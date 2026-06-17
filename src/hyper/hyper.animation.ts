import Lenis from 'lenis';

const INITIAL_SPACE_STATE = {
  scroll: 0,
  targetSpeed: 0,
  velocity: 0,
  mouseX: 0,
  mouseY: 0,
};

const SPACE_CONFIG = {
  starCount: 150,
  zGap: 1_600,
  loopSize: 10_000,
  camSpeed: 2.5,
  colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff'],
};

const LABELS = [
  'Hari Houdini',
  'Full Stack Dev',
  'Creative Coder',
  'Open to Work',
  "Let's Build",
];

const CARDS = [
  {
    id: 'PROJ.001',
    title: 'Who Am Eee',
    tags: ['TypeScript', 'WebGL'],
    year: '2025',
    x: 600,
    z: -800,
    rotation: -5,
    size: 's',
  },
  {
    id: 'PROJ.002',
    title: 'Project Alpha',
    tags: ['React', 'Bun'],
    year: '2024',
    x: -600,
    z: -2400,
    rotation: 5,
    size: 'm',
  },
  {
    id: 'PROJ.003',
    title: 'Dark Matter',
    tags: ['Python', 'ML'],
    year: '2024',
    x: 600,
    z: -4000,
    rotation: -3,
    size: 'l',
  },
  {
    id: 'PROJ.004',
    title: 'Void Runner',
    tags: ['Rust', 'WASM'],
    year: '2023',
    x: -600,
    z: -5600,
    rotation: 4,
    size: 'l',
  },
];

function initWorld(world: HTMLElement) {
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

  LABELS.forEach((text, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'section__item';
    wrapper.dataset.animElement = '';
    wrapper.dataset.type = 'text';
    wrapper.dataset.x = '0';
    wrapper.dataset.y = '0';
    wrapper.dataset.z = String(-i * SPACE_CONFIG.zGap);
    wrapper.dataset.rotation = '0';
    const inner = document.createElement('div');
    inner.className = 'section__item--title';
    inner.textContent = text;
    wrapper.appendChild(inner);
    world.appendChild(wrapper);
  });

  CARDS.forEach((card) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'section__item';
    wrapper.dataset.animElement = '';
    wrapper.dataset.type = 'card';
    wrapper.dataset.x = String(card.x);
    wrapper.dataset.y = '0';
    wrapper.dataset.z = String(card.z);
    wrapper.dataset.rotation = String(card.rotation);

    const cardEl = document.createElement('div');
    cardEl.classList.add('card', `card--${card.size}`);

    cardEl.innerHTML = `
      <div class="card-header">
        <span class="card-id">${card.id}</span>
        <span>↗</span>
      </div>
      <h2>${card.title}</h2>
      <div class="card-footer">
        <span>${card.tags.join(' · ')}</span>
        <span>${card.year}</span>
      </div>
    `;

    wrapper.appendChild(cardEl);
    world.appendChild(wrapper);
  });
}

function loadHyperSpaceAnimation(context: HTMLElement) {
  if (!context.shadowRoot) return;

  const state = { ...INITIAL_SPACE_STATE };

  const lenis = new Lenis({
    lerp: 0.08, // Increased weight for heavy feel
    syncTouch: true, // Replaces smoothTouch
  });

  lenis.on(
    'scroll',
    ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      state.scroll = scroll;
      state.targetSpeed = velocity;
    },
  );

  window.addEventListener('mousemove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  rafLoop(lenis, state, context.shadowRoot);
}

function rafLoop(
  lenis: Lenis,
  state: typeof INITIAL_SPACE_STATE,
  root: ShadowRoot,
) {
  const world = root.getElementById('world');
  const viewport = root.getElementById('viewport');

  if (!world || !viewport) return;

  const worldEl = world;
  const viewportEl = viewport;

  initWorld(worldEl);

  const animElements = Array.from<HTMLElement>(
    root.querySelectorAll('[data-anim-element]'),
  );

  const items = animElements.map((el) => ({
    el,
    type: el.dataset.type,
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
    baseZ: Number(el.dataset.z),
    rotation: Number(el.dataset.rotation),
  }));

  function raf(time: number) {
    lenis.raf(time);
    window.requestAnimationFrame(raf);

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    // Camera tilt
    const tiltX = state.mouseY * 5 - state.velocity * 0.5;
    const tiltY = state.mouseX * 5;

    worldEl.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    // Dynamic perspective (warp effect)
    const baseFov = 1000;
    const fov =
      baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
    viewportEl.style.perspective = `${fov}px`;

    const cameraZ = state.scroll * SPACE_CONFIG.camSpeed;

    items.forEach((item) => {
      const relZ = item.baseZ + cameraZ;
      const modC = SPACE_CONFIG.loopSize;

      let vizZ = ((relZ % modC) + modC) % modC;
      if (vizZ > 500) vizZ -= modC;

      let alpha = 1;
      if (vizZ < -3000) alpha = 0;
      else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;

      if (vizZ > 100 && item.type !== 'star') {
        alpha = 1 - (vizZ - 100) / 400;
      }

      if (alpha <= 0) {
        item.el.style.opacity = '0';
        return;
      }

      item.el.style.opacity = String(alpha);

      let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

      switch (item.type) {
        case 'star': {
          const stretch = Math.max(
            1,
            Math.min(1 + Math.abs(state.velocity) * 0.1, 10),
          );
          trans += ` scale3d(1, 1, ${stretch})`;
          break;
        }
        case 'text': {
          trans += ` rotateZ(${item.rotation}deg)`;
          console.log('velocity', Math.abs(state.velocity));
          if (Math.abs(state.velocity) > 1) {
            const offset = state.velocity * 2;
            item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
          } else {
            item.el.style.textShadow = 'black 5px 5px 5px';
          }
          break;
        }
        default: {
          const t = time * 0.001;
          const float = Math.sin(t + item.x) * 10;
          trans += ` rotateZ(${item.rotation}deg) rotateY(${float}deg)`;
          break;
        }
      }

      item.el.style.transform = trans;
    });
  }

  window.requestAnimationFrame(raf);
}

export default loadHyperSpaceAnimation;
