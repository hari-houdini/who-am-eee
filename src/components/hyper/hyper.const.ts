import type { SpaceConfig, SpaceState } from "./hyper.types";

/**
 * Initial mutable state for the hyper-space animation loop.
 * Copied (not referenced) at startup so each component instance owns its state.
 */
const INITIAL_SPACE_STATE: SpaceState = {
	scroll: 0,
	targetSpeed: 0,
	velocity: 0,
	mouseX: 0,
	mouseY: 0,
};

/**
 * Static scene configuration used by the RAF loop.
 *
 * @remarks
 * `loopSize` is derived at runtime from the number of `[data-anim-element]`
 * nodes in `hyper.template.html` multiplied by `zGap`, so adding or removing
 * scene items only requires editing the template — not this file.
 */
const SPACE_CONFIG: SpaceConfig = {
	zGap: 1_200,
	camSpeed: 2.5,
	colors: ["#ff003c", "#00f3ff", "#ccff00", "#ffffff"],
};

export { INITIAL_SPACE_STATE, SPACE_CONFIG };
