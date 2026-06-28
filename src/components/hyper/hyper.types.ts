/**
 * Mutable scroll and input state tracked per animation frame in the RAF loop.
 * A single instance is created in {@link loadHyperSpaceAnimation} and mutated
 * throughout the session.
 */
type SpaceState = {
	/** Smoothed scroll position in pixels from {@link LerpScroll}. */
	scroll: number;
	/** Target scroll speed set by the scroll event callback. */
	targetSpeed: number;
	/** Smoothed velocity used for stretch and glitch effects. */
	velocity: number;
	/** Normalised mouse X position in the range [-1, 1]. */
	mouseX: number;
	/** Normalised mouse Y position in the range [-1, 1]. */
	mouseY: number;
};

/**
 * Static scene configuration.
 *
 * @remarks
 * `loopSize` is intentionally absent — it is computed at runtime as
 * `animElements.length * zGap` so the scene loops correctly after any
 * edits to `hyper.template.html` without touching this type.
 */
type SpaceConfig = {
	/** Z-axis gap in pixels between consecutive scene items. */
	zGap: number;
	/** Multiplier applied to the scroll position to derive camera Z. */
	camSpeed: number;
	/** Palette used for chromatic aberration effects. */
	colors: string[];
};

export type { SpaceConfig, SpaceState };
