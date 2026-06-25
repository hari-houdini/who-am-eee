import Lenis from "lenis";
import { createCardElement } from "../card/card.factory";
import {
	CARDS,
	INITIAL_SPACE_STATE,
	LABELS,
	SPACE_CONFIG,
} from "./hyper.const";

/**
 * Populates the `#world` element with all scene items:
 * section text labels and portfolio cards.
 *
 * Items are assigned `data-*` attributes consumed each frame by {@link rafLoop}.
 * Labels and cards are placed at evenly-spaced Z intervals defined by
 * {@link SpaceConfig.zGap}.
 *
 * @param world - The container element to populate (the `#world` div inside Shadow DOM).
 */
function initWorld(world: HTMLElement): void {
	let zIndex = -200;
	const vpScale = Math.min(1, window.innerWidth / 500);

	Object.entries(LABELS).forEach(([key, { text, description }]) => {
		const wrapper = document.createElement("div");
		wrapper.className = "section__item";
		wrapper.dataset.animElement = "";
		wrapper.dataset.type = "text";
		wrapper.dataset.x = "0";
		wrapper.dataset.y = "0";
		wrapper.dataset.z = String(zIndex);
		wrapper.dataset.rotation = "0";

		const inner = document.createElement("div");
		inner.className = "section__item--title";
		inner.textContent = text;

		if (description) {
			const descriptionEl = document.createElement("div");
			descriptionEl.className = "section__item--tagline";
			descriptionEl.textContent = description;
			inner.appendChild(descriptionEl);
		}

		wrapper.appendChild(inner);
		world.appendChild(wrapper);

		zIndex -= SPACE_CONFIG.zGap;

		const cards = CARDS[key] ?? [];

		cards.forEach((card) => {
			const cardWrapper = document.createElement("div");
			cardWrapper.className = "section__item";
			cardWrapper.dataset.animElement = "";
			cardWrapper.dataset.type = "card";
			cardWrapper.dataset.x = String((card.x ?? 0) * vpScale);
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

	const world = context.shadowRoot.getElementById("world");

	if (!world) return;

	initWorld(world);

	const lenis = new Lenis({
		lerp: 0.08,
		syncTouch: true,
	});

	lenis.on(
		"scroll",
		({ scroll, velocity }: { scroll: number; velocity: number }) => {
			state.scroll = scroll;
			state.targetSpeed = velocity;
		},
	);

	window.addEventListener("mousemove", (e: MouseEvent) => {
		state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
		state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
	});

	rafLoop(lenis, state, context.shadowRoot);

	window.addEventListener("card:modal-opened", () => {
		lenis.stop();
	});
	window.addEventListener("card:modal-closed", () => {
		lenis.start();
	});
}

/**
 * Runs the per-frame animation loop for the hyper-space scene.
 *
 * Each frame:
 * 1. Calls `lenis.raf(time)` for smooth-scroll integration.
 * 2. Smooths `state.velocity` toward `state.targetSpeed` via lerp.
 * 3. Applies camera tilt from mouse position and scroll speed (skipped under
 *    `prefers-reduced-motion: reduce`).
 * 4. Adjusts perspective (FOV warp) based on speed — cached to avoid writing
 *    the style property every frame when the value has not meaningfully changed.
 * 5. Positions every scene item along the Z axis with depth-looping and opacity fade.
 *
 * All visual mutations use only `transform` and `opacity` (compositor path, 60 fps).
 * Static per-item string fragments (`txPrefix`, `rzSuffix`) are pre-computed at
 * setup so the inner loop only constructs strings for dynamic values (vizZ, float).
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
	const world = root.getElementById("world");
	const viewport = root.getElementById("viewport");

	if (!world || !viewport) return;

	const worldEl: HTMLElement = world;
	const viewportEl: HTMLElement = viewport;

	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

	const animElements = Array.from<HTMLElement>(
		root.querySelectorAll("[data-anim-element]"),
	);

	const items = animElements.map((el) => {
		const x = Number(el.dataset.x ?? "0");
		const y = Number(el.dataset.y ?? "0");
		const baseZ = Number(el.dataset.z ?? "0");
		const rotation = Number(el.dataset.rotation ?? "0");
		return {
			el,
			type: el.dataset.type,
			x,
			y,
			baseZ,
			rotation,
			/** Pre-computed `translate3d` prefix — only vizZ needs to be appended each frame. */
			txPrefix: `translate3d(${x}px, ${y}px, `,
			/** Pre-computed `rotateZ` suffix — empty string when rotation is 0. */
			rzSuffix: rotation !== 0 ? ` rotateZ(${rotation}deg)` : "",
		};
	});

	/** Last perspective (FOV) value written; avoids a DOM style write every frame when velocity is stable. */
	let lastFov = -1;

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
			const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
			if (Math.abs(fov - lastFov) > 0.5) {
				viewportEl.style.perspective = `${fov}px`;
				lastFov = fov;
			}
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

			if (vizZ > 100) {
				alpha = 1 - (vizZ - 100) / 400;
			}

			if (alpha <= 0) {
				item.el.style.opacity = "0";
				item.el.style.display = "none";
				return;
			}

			item.el.style.opacity = String(alpha);
			item.el.style.display = "flex";

			let trans = `${item.txPrefix}${vizZ}px)`;

			switch (item.type) {
				case "text": {
					trans += item.rzSuffix;

					if (!reduceMotion.matches) {
						const transX = (-state.mouseX / (state.mouseX + 50)) * 100;
						const transY = (-state.mouseY / (state.mouseY + 50)) * 100;

						const titleEl = item.el.querySelector<HTMLElement>(
							".section__item--title",
						);
						if (titleEl) {
							titleEl.style.backgroundPosition = `${transX}% ${transY}%`;
						}

						if (Math.abs(state.velocity) > 1) {
							const offset = state.velocity * 2;
							item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
						} else {
							item.el.style.textShadow = "none";
						}
					}
					break;
				}
				default: {
					if (!reduceMotion.matches) {
						const t = time * 0.001;
						const float = Math.sin(t + item.x) * 10;
						trans += `${item.rzSuffix} rotateY(${float}deg)`;
					} else {
						trans += item.rzSuffix;
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
