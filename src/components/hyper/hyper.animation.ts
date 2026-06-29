import { LerpScroll } from "../../shared/utils/lerp-scroll.utils";
import { INITIAL_SPACE_STATE, SPACE_CONFIG } from "./hyper.const";

/**
 * Entry point called from the `<hyper-space>` element's `connectedCallback`.
 *
 * Reads the pre-baked scene items from `hyper.template.html` to compute the
 * maximum scroll position, creates a {@link LerpScroll} instance clamped to that
 * value, registers scroll and mouse listeners that update shared state, then
 * delegates the per-frame rendering to {@link rafLoop}.
 *
 * @param context - The `<hyper-space>` custom element. The template HTML must
 *   already be hydrated into its light DOM (done in `connectedCallback`).
 * @returns Cleanup function to call from `disconnectedCallback`.
 */
function loadHyperSpaceAnimation(context: HTMLElement): () => void {
	const state = { ...INITIAL_SPACE_STATE };

	if (!context.querySelector("#world")) return () => {};

	// Compute the max scroll from the deepest item's z so the camera stops
	// just as the last item is comfortably visible (vizZ ≈ -200).
	const allAnimEls = context.querySelectorAll<HTMLElement>(
		"[data-anim-element]",
	);
	let lastItemZ = 0;
	allAnimEls.forEach((el) => {
		const z = Number(el.dataset.z ?? "0");
		if (z < lastItemZ) lastItemZ = z;
	});
	const maxScroll = (Math.abs(lastItemZ) - 200) / SPACE_CONFIG.camSpeed;

	const lerp = new LerpScroll(0.08, maxScroll);

	lerp.on(
		"scroll",
		({ scroll, velocity }: { scroll: number; velocity: number }) => {
			state.scroll = scroll;
			state.targetSpeed = velocity;
		},
	);

	const onMouseMove = (e: MouseEvent): void => {
		state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
		state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
	};
	window.addEventListener("mousemove", onMouseMove);

	const cancelRaf = rafLoop(lerp, state, context);

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
		window.removeEventListener("mousemove", onMouseMove);
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
 * 5. Positions every scene item along the Z axis and computes opacity fade
 *    via CSSOM {@link CSSStyleRule} updates. Scroll is clamped externally by
 *    {@link LerpScroll} so items do not loop — the scene has a defined end.
 *
 * Visual mutations use `document.adoptedStyleSheets` (Chrome 73+, Firefox 101+,
 * Safari 16.4+). On Safari < 16.4 where `document.adoptedStyleSheets` is
 * `undefined`, the fallback uses direct `element.style.*` CSSOM writes.
 * Both paths are fully safe under `style-src 'self'` CSP — JavaScript CSSOM API
 * writes are not covered by `style-src` (only HTML-parsed `style=""` attributes are).
 *
 * @param lerp - The {@link LerpScroll} instance providing the scroll clock.
 * @param state - Mutable scene state mutated by scroll and mouse listeners.
 * @param root - The `<hyper-space>` element containing the scene items.
 * @returns Cleanup function that cancels the RAF loop and removes the animation stylesheet.
 */
function rafLoop(
	lerp: LerpScroll,
	state: typeof INITIAL_SPACE_STATE,
	root: Element,
): () => void {
	const worldMaybe = root.querySelector<HTMLElement>("#world");
	const viewportMaybe = root.querySelector<HTMLElement>("#viewport");

	if (!worldMaybe || !viewportMaybe) return () => {};

	// Bind to definitely-typed names so the raf closure captures non-null HTMLElement.
	const world: HTMLElement = worldMaybe;
	const viewport: HTMLElement = viewportMaybe;

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

	// Prefer document.adoptedStyleSheets (Chrome 73+, FF 101+, Safari 16.4+).
	// CSSStyleRule.style.* writes are safe under style-src 'self' — they modify
	// an existing stylesheet rule, not the element's inline style attribute.
	//
	// On Safari < 16.4 where document.adoptedStyleSheets is undefined, fall back
	// to direct element.style.* writes. JavaScript CSSOM API writes are never
	// covered by the CSP style-src directive — only HTML style="" attribute parsing is.
	const animSheet =
		document.adoptedStyleSheets !== undefined ? new CSSStyleSheet() : null;

	/** Cleanup to remove the animation stylesheet from document.adoptedStyleSheets. */
	let cleanupSheet: () => void;

	if (animSheet !== null) {
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, animSheet];
		cleanupSheet = (): void => {
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
				(s) => s !== animSheet,
			);
		};
	} else {
		cleanupSheet = (): void => {};
	}

	/**
	 * Maps item array index → pre-cached {@link CSSStyleRule} for title elements.
	 * Only populated when `animSheet !== null`.
	 */
	const titleStyleRuleMap = new Map<number, CSSStyleRule>();

	/** Parallel array of CSSStyleRules for scene items. `null` entries when `animSheet` is null. */
	const itemStyleRules: Array<CSSStyleRule | null> = items.map(() => null);

	/** CSSStyleRule for the world container. `null` when `animSheet` is null. */
	let worldRule: CSSStyleRule | null = null;
	/** CSSStyleRule for the viewport element. `null` when `animSheet` is null. */
	let viewportRule: CSSStyleRule | null = null;

	if (animSheet !== null) {
		// Insert rules in sequential index order:
		// 0 = #world, 1 = #viewport, 2…N-1 = scene items, N… = title elements.
		animSheet.insertRule("#world { }", 0);
		animSheet.insertRule("#viewport { }", 1);

		items.forEach((item, i) => {
			item.el.dataset.si = String(i);
			animSheet.insertRule(`[data-si="${i}"] { }`, animSheet.cssRules.length);
		});

		items.forEach((item, i) => {
			if (!item.titleEl) return;
			item.titleEl.dataset.sti = String(i);
			const ruleIdx = animSheet.cssRules.length;
			animSheet.insertRule(`[data-sti="${i}"] { }`, ruleIdx);
			const raw = animSheet.cssRules.item(ruleIdx);
			if (raw) titleStyleRuleMap.set(i, raw as CSSStyleRule);
		});

		const worldRuleRaw = animSheet.cssRules.item(0);
		const viewportRuleRaw = animSheet.cssRules.item(1);
		if (worldRuleRaw) worldRule = worldRuleRaw as CSSStyleRule;
		if (viewportRuleRaw) viewportRule = viewportRuleRaw as CSSStyleRule;

		items.forEach((_, i) => {
			const rule = animSheet.cssRules.item(2 + i);
			itemStyleRules[i] = rule !== null ? (rule as CSSStyleRule) : null;
		});
	}

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
			const tilt = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
			if (worldRule !== null) {
				worldRule.style.transform = tilt;
			} else {
				world.style.transform = tilt;
			}

			const baseFov = 1000;
			const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
			if (Math.abs(fov - lastFov) > 0.5) {
				const fovPx = `${fov}px`;
				if (viewportRule !== null) {
					viewportRule.style.perspective = fovPx;
				} else {
					viewport.style.perspective = fovPx;
				}
				lastFov = fov;
			}
		}

		const cameraZ = state.scroll * SPACE_CONFIG.camSpeed;

		items.forEach((item, i) => {
			// No modulo loop — scroll is clamped by LerpScroll so the camera
			// travels the scene once and stops just past the last item.
			const vizZ = item.baseZ + cameraZ;

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
			const itemRule = itemStyleRules[i] ?? null;

			switch (item.type) {
				case "text": {
					trans += item.rzSuffix;

					if (!reduceMotion.matches && item.titleEl) {
						const transX = (-state.mouseX / (state.mouseX + 50)) * 100;
						const transY = (-state.mouseY / (state.mouseY + 50)) * 100;
						const bp = `${transX}% ${transY}%`;
						const shadow =
							Math.abs(state.velocity) > 1
								? `${state.velocity * 2}px 0 red, ${-state.velocity * 2}px 0 cyan`
								: "none";

						const titleRule = titleStyleRuleMap.get(i);
						if (titleRule !== undefined) {
							titleRule.style.backgroundPosition = bp;
							titleRule.style.textShadow = shadow;
						} else {
							item.titleEl.style.backgroundPosition = bp;
							item.titleEl.style.textShadow = shadow;
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

			if (itemRule !== null) {
				itemRule.style.transform = trans;
				itemRule.style.opacity = String(alpha);
			} else {
				item.el.style.transform = trans;
				item.el.style.opacity = String(alpha);
			}
		});
	}

	currentRafId = window.requestAnimationFrame(raf);
	return (): void => {
		cancelAnimationFrame(currentRafId);
		cleanupSheet();
	};
}

export { loadHyperSpaceAnimation };
