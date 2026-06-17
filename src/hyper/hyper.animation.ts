import Lenis from 'lenis';

const INITIAL_SPACE_STATE = {
  scroll: 0,
  targetSpeed: 0,
  velocity: 0,
  mouseX: 0,
  mouseY: 0,
};

const SPACE_CONFIG = {
  itemCount: 20,
  starCount: 150,
  zGap: 800,
  loopSize: 16_000,
  camSpeed: 2.5,
  colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff'],
};

const lenis = new Lenis({
  smoothWheel: true,
  lerp: 0.08, // Increased weight for heavy feel
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  syncTouch: true,
});

function loadHyperSpaceAnimation(context: HTMLElement) {
  if (!context.shadowRoot) return;

  const state = { ...INITIAL_SPACE_STATE };

  lenis.on('scroll', ({ scroll, velocity }) => {
    console.log(scroll, velocity);
    state.scroll = scroll;
    state.targetSpeed = velocity;
  });

  window.addEventListener('mousemove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // const animElements = Array.from<HTMLElement>(
  //   context.shadowRoot.querySelectorAll('[data-anim-element]'),
  // );

  rafLoop(lenis, state, context.shadowRoot);
}

function rafLoop(
  lenis: Lenis,
  state: typeof INITIAL_SPACE_STATE,
  root: ShadowRoot,
) {
  const animElements = Array.from<HTMLElement>(
    root.querySelectorAll('[data-anim-element]'),
  );

  const world = root.getElementById('world');
  const viewport = root.getElementById('viewport');

  const items = animElements.map((el) => ({
    el,
    type: el.dataset.type,
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
    baseZ: Number(el.dataset.z),
    rotation: Number(el.dataset.rotation),
  }));

  console.log(items);

  function raf(time: number) {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
    // const delta = time - lastTime;

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    // 1. Camera Tilt & Shake
    // Add slight noise based on velocity
    // const shake = state.velocity * 0.2;
    const tiltX = state.mouseY * 5 - state.velocity * 0.5;
    const tiltY = state.mouseX * 5;

    if (!world || !viewport) return;

    world.style.transform = `
                rotateX(${tiltX}deg)
                rotateY(${tiltY}deg)
            `;

    // 2. Dynamic Perspective (Warp)
    const baseFov = 1000;
    const fov =
      baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
    viewport.style.perspective = `${fov}px`;

    // 3. Chromatic Aberration Simulation (simulated via global filter or just on elements)
    // Just applying a subtle shift to the body might be heavy, let's do it on text maybe?
    // Or use the scanline color offset

    // 4. Item Loop
    const cameraZ = state.scroll * SPACE_CONFIG.camSpeed;

    items.forEach((item) => {
      // Calculate position relative to camera
      // item.baseZ is negative.

      const relZ = item.baseZ + cameraZ;

      // Infinite Wrapping modulo
      // But simplified:
      const modC = SPACE_CONFIG.loopSize;

      // Centering the repeat
      // ((relZ % modC) + modC) % modC  -> maps to [0, modC]

      let vizZ = ((relZ % modC) + modC) % modC;
      if (vizZ > 500) vizZ -= modC; // Wrap back if too close/behind

      // Determine Opacity
      // Fade in at -4000, fade out at 200
      // Opacity logic
      let alpha = 1;
      if (vizZ < -3000) alpha = 0;
      else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;

      if (vizZ > 100 && item.type !== 'star')
        alpha = 1 - (vizZ - 100) / 400;

      if (alpha <= 0) {
        item.el.style.opacity = '0';
        return;
      }

      let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

      switch (item.type) {
        case 'star': {
          // Warp Stars
          const stretch = Math.max(
            1,
            Math.min(1 + Math.abs(state.velocity) * 0.1, 10),
          );
          trans += ` scale3d(1, 1, ${stretch})`;
          break;
        }
        case 'text': {
          trans += ` rotateZ(${item.rotation}deg)`;
          // RGB Split effect on text (simulated with text-shadow)
          if (Math.abs(state.velocity) > 1) {
            const offset = state.velocity * 2;
            item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
          } else {
            item.el.style.textShadow = 'none';
          }
          break;
        }
        default: {
          // Card floats
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
