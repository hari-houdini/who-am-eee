import { LerpScroll } from "../../shared/utils/lerp-scroll.utils";
import { INITIAL_SPACE_STATE, SPACE_CONFIG } from "./hyper.const";

/**
 * Entry point called from the `<hyper-space>` element's `connectedCallback`.
 *
 * Initialises the scene DOM via {@link initWorld}, creates a {@link LerpScroll}
 * instance, registers scroll and mouse listeners that update shared state, then
 * delegates the per-frame rendering to {@link rafLoop}.
 *
 * @param context - The `<hyper-space>` custom element. Its Shadow DOM must
 *   already be attached; the scene items are declared in `hyper.template.html`.
 * @returns Cleanup function to call from `disconnectedCallback`.
 */
function loadHyperSpaceAnimation(context: HTMLElement): () => void {
	if (!context.shadowRoot) return () => {};

	const state = { ...INITIAL_SPACE_STATE };

	if (!context.shadowRoot.getElementById("world")) return () => {};

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
 *    `prefers-reduced-motion: reduce`) via CSSOM {@link CSSStyleRule} updates.
 * 4. Adjusts perspective (FOV warp) based on speed — cached to skip the rule
 *    write when velocity is stable.
 * 5. Positions every scene item along the Z axis with depth-looping and opacity
 *    fade via CSSOM {@link CSSStyleRule} updates.
 *
 * Visual mutations go through a programmatically-created {@link CSSStyleSheet}
 * adopted into the shadow root. `CSSStyleRule.style.*` writes modify an existing
 * stylesheet rule — NOT the element's inline style attribute — so this loop is
 * fully safe under `style-src 'self'` CSP with no `unsafe-*` keywords required.
 * This also eliminates the `animation.effect` null-access crash on Safari.
 *
 * @param lerp - The {@link LerpScroll} instance providing the scroll clock.
 * @param state - Mutable scene state mutated by scroll and mouse listeners.
 * @param root - Shadow root of the `<hyper-space>` element.
 * @returns Cleanup function that cancels the RAF loop and removes the animation stylesheet.
 */
function rafLoop(
	lerp: LerpScroll,
	state: typeof INITIAL_SPACE_STATE,
	root: ShadowRoot,
): () => void {
	const world = root.getElementById("world");
	const viewport = root.getElementById("viewport");

	if (!world || !viewport) return () => {};

	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

	const animElements = Array.from<HTMLElement>(
		root.querySelectorAll("[data-anim-element]"),
	);

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
		/** Inner title element for text items; `null` for cards. */
		titleEl: HTMLElement | null;
		/** Whether the element currently carries the hidden class — guards redundant classList mutations. */
		hidden: boolean;
	};

	const items: ItemData[] = animElements.map((el) => {
		const x = Number(el.dataset.x ?? "0");
		const y = Number(el.dataset.y ?? "0");
		const baseZ = Number(el.dataset.z ?? "0");
		const rotation = Number(el.dataset.rotation ?? "0");

		const titleEl =
			el.dataset.type === "text"
				? el.querySelector<HTMLElement>(".section__item--title")
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
			titleEl,
			hidden: false,
		};
	});

	// Build a per-element CSSStyleSheet inside the shadow root.
	// CSSStyleRule.style.* writes modify an existing stylesheet rule — NOT the
	// element's inline style attribute — so they are safe under style-src 'self'.
	const animSheet = new CSSStyleSheet();

	// Insert rules in sequential index order:
	// 0 = #world, 1 = #viewport, 2…N-1 = scene items, N… = title elements.
	animSheet.insertRule("#world { }", 0);
	animSheet.insertRule("#viewport { }", 1);

	items.forEach((item, i) => {
		item.el.dataset.si = String(i);
		animSheet.insertRule(`[data-si="${i}"] { }`, animSheet.cssRules.length);
	});

	/**
	 * Maps item array index → CSSOM rule index for title elements (text items only).
	 * Built once at setup; read O(1) each frame.
	 */
	const titleRuleMap = new Map<number, number>();
	items.forEach((item, i) => {
		if (!item.titleEl) return;
		item.titleEl.dataset.sti = String(i);
		titleRuleMap.set(i, animSheet.cssRules.length);
		animSheet.insertRule(`[data-sti="${i}"] { }`, animSheet.cssRules.length);
	});

	root.adoptedStyleSheets = [...root.adoptedStyleSheets, animSheet];

	// Cache CSSStyleRule references for O(1) per-frame access.
	// item() returns CSSRule | null (avoids the noUncheckedIndexedAccess concern on indexers).
	// Rules were just inserted so these indices are guaranteed valid — guard is belt-and-suspenders.
	const worldRuleRaw = animSheet.cssRules.item(0);
	const viewportRuleRaw = animSheet.cssRules.item(1);
	if (!worldRuleRaw || !viewportRuleRaw) return () => {};
	const worldRule = worldRuleRaw as CSSStyleRule;
	const viewportRule = viewportRuleRaw as CSSStyleRule;
	/** Parallel array of CSSStyleRules for scene items, indexed by item position. */
	const itemStyleRules: Array<CSSStyleRule | null> = items.map((_, i) => {
		const rule = animSheet.cssRules.item(2 + i);
		return rule !== null ? (rule as CSSStyleRule) : null;
	});

	/** Last perspective (FOV) value written; avoids a rule update every frame when velocity is stable. */
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
			worldRule.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

			const baseFov = 1000;
			const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
			if (Math.abs(fov - lastFov) > 0.5) {
				viewportRule.style.perspective = `${fov}px`;
				lastFov = fov;
			}
		}

		const cameraZ = state.scroll * SPACE_CONFIG.camSpeed;
		// loopSize derived from the actual DOM count so it stays correct
		// if items are added to hyper.template.html without touching this file.
		const modC = animElements.length * SPACE_CONFIG.zGap;

		items.forEach((item, i) => {
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
				if (!item.hidden) {
					item.el.classList.add("section__item--hidden");
					item.hidden = true;
				}
				return;
			}

			if (item.hidden) {
				item.el.classList.remove("section__item--hidden");
				item.hidden = false;
			}

			let trans = `${item.txPrefix}${vizZ}px)`;

			const itemRule = itemStyleRules[i];

			switch (item.type) {
				case "text": {
					trans += item.rzSuffix;

					if (!reduceMotion.matches && item.titleEl) {
						const transX = (-state.mouseX / (state.mouseX + 50)) * 100;
						const transY = (-state.mouseY / (state.mouseY + 50)) * 100;

						const shadow =
							Math.abs(state.velocity) > 1
								? `${state.velocity * 2}px 0 red, ${-state.velocity * 2}px 0 cyan`
								: "none";

						const titleRuleIdx = titleRuleMap.get(i);
						if (titleRuleIdx !== undefined) {
							const rawTitleRule = animSheet.cssRules.item(titleRuleIdx);
							if (rawTitleRule) {
								const titleRule = rawTitleRule as CSSStyleRule;
								titleRule.style.backgroundPosition = `${transX}% ${transY}%`;
								titleRule.style.textShadow = shadow;
							}
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

			if (itemRule) {
				itemRule.style.transform = trans;
				itemRule.style.opacity = String(alpha);
			}
		});
	}

	currentRafId = window.requestAnimationFrame(raf);
	return (): void => {
		cancelAnimationFrame(currentRafId);
		root.adoptedStyleSheets = root.adoptedStyleSheets.filter(
			(s) => s !== animSheet,
		);
	};
}

export { loadHyperSpaceAnimation };
