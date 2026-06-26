import { LerpScroll } from "../../shared/utils/lerp-scroll.utils";
import { createCardElement } from "../card/card.factory";
import {
	CARDS,
	INITIAL_SPACE_STATE,
	LABELS,
	SPACE_CONFIG,
} from "./hyper.const";

/**
 * Creates a paused Web Animations API animation that immediately holds the
 * provided keyframe via `fill: 'forwards'`. Update the displayed value each
 * frame with `(anim.effect as KeyframeEffect).setKeyframes([newKeyframe])`.
 *
 * WAA effects do not write style attributes, so this is safe under strict
 * `style-src 'self'` CSP directives.
 *
 * @param el - Target element to animate.
 * @param keyframe - Initial CSS keyframe applied immediately.
 * @returns Paused {@link Animation} ready for per-frame keyframe updates.
 */
function makeStaticAnim(el: Element, keyframe: Keyframe): Animation {
	const anim = el.animate([keyframe], { duration: 1, fill: "forwards" });
	// Seek to the end so fill: 'forwards' applies the keyframe right away.
	anim.currentTime = 1;
	anim.pause();
	return anim;
}

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
 * Initialises the scene DOM via {@link initWorld}, creates a {@link LerpScroll}
 * instance, registers scroll and mouse listeners that update shared state, then
 * delegates the per-frame rendering to {@link rafLoop}.
 *
 * @param context - The `<hyper-space>` custom element. Its Shadow DOM must
 *   already be attached and must contain a `#world` element.
 * @returns Cleanup function to call from `disconnectedCallback`.
 */
function loadHyperSpaceAnimation(context: HTMLElement): () => void {
	if (!context.shadowRoot) return () => {};

	const state = { ...INITIAL_SPACE_STATE };

	const world = context.shadowRoot.getElementById("world");

	if (!world) return () => {};

	initWorld(world);

	const lerp = new LerpScroll(0.08);

	lerp.on(
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

	const cancelRaf = rafLoop(lerp, state, context.shadowRoot);

	const onModalOpen = (): void => {
		lerp.stop();
		document.body.classList.add("body--scroll-locked");
	};
	const onModalClose = (): void => {
		lerp.start();
		document.body.classList.remove("body--scroll-locked");
	};

	window.addEventListener("card:modal-opened", onModalOpen);
	window.addEventListener("card:modal-closed", onModalClose);

	return (): void => {
		lerp.destroy();
		cancelRaf();
		window.removeEventListener("card:modal-opened", onModalOpen);
		window.removeEventListener("card:modal-closed", onModalClose);
	};
}

/**
 * Runs the per-frame animation loop for the hyper-space scene.
 *
 * Each frame:
 * 1. Calls `lerp.raf(time)` (no-op kept for API symmetry).
 * 2. Smooths `state.velocity` toward `state.targetSpeed` via lerp.
 * 3. Applies camera tilt from mouse position and scroll speed (skipped under
 *    `prefers-reduced-motion: reduce`) via Web Animations API.
 * 4. Adjusts perspective (FOV warp) based on speed via Web Animations API —
 *    cached to avoid a keyframe update every frame when velocity is stable.
 * 5. Positions every scene item along the Z axis with depth-looping and opacity
 *    fade via Web Animations API.
 *
 * All visual mutations use WAA `KeyframeEffect.setKeyframes()` instead of
 * `element.style.*` writes. WAA effects operate on the Animation model and do
 * NOT create or modify style attributes, making this loop safe under strict
 * `style-src 'self'` CSP with no `unsafe-*` keywords required.
 *
 * @param lerp - The {@link LerpScroll} instance providing the scroll clock.
 * @param state - Mutable scene state mutated by scroll and mouse listeners.
 * @param root - Shadow root of the `<hyper-space>` element.
 * @returns Cleanup function that cancels the RAF loop.
 */
function rafLoop(
	lerp: LerpScroll,
	state: typeof INITIAL_SPACE_STATE,
	root: ShadowRoot,
): () => void {
	const world = root.getElementById("world");
	const viewport = root.getElementById("viewport");

	if (!world || !viewport) return () => {};

	const worldEl: HTMLElement = world;
	const viewportEl: HTMLElement = viewport;

	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

	const animElements = Array.from<HTMLElement>(
		root.querySelectorAll("[data-anim-element]"),
	);

	// WAA instances for the camera-level transforms.
	const worldAnim = makeStaticAnim(worldEl, { transform: "none" });
	const viewportAnim = makeStaticAnim(viewportEl, { perspective: "1000px" });

	/** Per-item animation data. */
	type ItemData = {
		/** Scene element. */
		el: HTMLElement;
		/** Dataset type tag ('text' | 'card'). */
		type: string | undefined;
		/** X offset in pixels. */
		x: number;
		/** Y offset in pixels. */
		y: number;
		/** Base Z depth in the scene. */
		baseZ: number;
		/** Z rotation in degrees. */
		rotation: number;
		/** Pre-computed `translate3d` prefix — only vizZ needs appending each frame. */
		txPrefix: string;
		/** Pre-computed `rotateZ` suffix — empty string when rotation is 0. */
		rzSuffix: string;
		/** WAA animation controlling transform and opacity for this element. */
		anim: Animation;
		/** Inner title element for text items; `null` for cards. */
		titleEl: HTMLElement | null;
		/** WAA animation controlling backgroundPosition and textShadow on the title. */
		titleAnim: Animation | null;
	};

	const items: ItemData[] = animElements.map((el) => {
		const x = Number(el.dataset.x ?? "0");
		const y = Number(el.dataset.y ?? "0");
		const baseZ = Number(el.dataset.z ?? "0");
		const rotation = Number(el.dataset.rotation ?? "0");

		const anim = makeStaticAnim(el, {
			transform: "translate3d(0,0,0)",
			opacity: "1",
		});

		const titleEl =
			el.dataset.type === "text"
				? el.querySelector<HTMLElement>(".section__item--title")
				: null;

		const titleAnim =
			titleEl !== null
				? makeStaticAnim(titleEl, {
						backgroundPosition: "40% 50%",
						textShadow: "none",
					})
				: null;

		return {
			el,
			type: el.dataset.type,
			x,
			y,
			baseZ,
			rotation,
			txPrefix: `translate3d(${x}px, ${y}px, `,
			rzSuffix: rotation !== 0 ? ` rotateZ(${rotation}deg)` : "",
			anim,
			titleEl,
			titleAnim,
		};
	});

	/** Last perspective (FOV) value written; avoids a keyframe update every frame when velocity is stable. */
	let lastFov = -1;

	/** Most-recently scheduled RAF handle; updated each frame so cleanup can cancel. */
	let currentRafId = 0;

	/** Inner RAF callback — scheduled recursively via `requestAnimationFrame`. */
	function raf(time: number): void {
		lerp.raf(time);
		currentRafId = window.requestAnimationFrame(raf);

		state.velocity += (state.targetSpeed - state.velocity) * 0.1;

		if (!reduceMotion.matches) {
			const tiltX = state.mouseY * 5 - state.velocity * 0.5;
			const tiltY = state.mouseX * 5;
			// el.animate() always creates a KeyframeEffect — the cast is safe.
			(worldAnim.effect as KeyframeEffect).setKeyframes([
				{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)` },
			]);

			const baseFov = 1000;
			const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
			if (Math.abs(fov - lastFov) > 0.5) {
				(viewportAnim.effect as KeyframeEffect).setKeyframes([
					{ perspective: `${fov}px` },
				]);
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
				item.el.classList.add("section__item--hidden");
				return;
			}

			item.el.classList.remove("section__item--hidden");

			let trans = `${item.txPrefix}${vizZ}px)`;

			switch (item.type) {
				case "text": {
					trans += item.rzSuffix;

					if (!reduceMotion.matches && item.titleEl && item.titleAnim) {
						const transX = (-state.mouseX / (state.mouseX + 50)) * 100;
						const transY = (-state.mouseY / (state.mouseY + 50)) * 100;

						const shadow =
							Math.abs(state.velocity) > 1
								? `${state.velocity * 2}px 0 red, ${-state.velocity * 2}px 0 cyan`
								: "none";

						(item.titleAnim.effect as KeyframeEffect).setKeyframes([
							{
								backgroundPosition: `${transX}% ${transY}%`,
								textShadow: shadow,
							},
						]);
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

			(item.anim.effect as KeyframeEffect).setKeyframes([
				{
					transform: trans,
					opacity: String(alpha),
				},
			]);
		});
	}

	currentRafId = window.requestAnimationFrame(raf);
	return (): void => {
		cancelAnimationFrame(currentRafId);
	};
}

export { loadHyperSpaceAnimation };
