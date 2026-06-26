import type { Card } from "../../shared/types/card.types";

/**
 * A dictionary of named sections, each holding display text and an optional descriptor.
 * Keys are section identifiers (e.g. `'about'`, `'tech_stack'`).
 */
type Label = Record<
	string,
	{
		/** Primary heading text rendered in the 3D scene. */
		text: string;
		/** Optional subtitle displayed beneath the heading. */
		description?: string;
	}
>;

/**
 * A mapping from section key (matching a {@link Label} key) to an array
 * of cards to display at that section's depth in the scene.
 */
type Cards = Record<string, Card[]>;

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
 * @remarks `itemCount` and `loopSize` are computed getters — do not set them manually.
 */
type SpaceConfig = {
	/** Total number of positioned items (text + cards). Computed from LABELS and CARDS. */
	itemCount: number;
	/** Z-axis gap in pixels between consecutive scene items. */
	zGap: number;
	/** Total Z depth of the scene before it loops. Computed as `itemCount * zGap`. */
	loopSize: number;
	/** Multiplier applied to the scroll position to derive camera Z. */
	camSpeed: number;
	/** Palette used for chromatic aberration effects. */
	colors: string[];
};

export type { Cards, Label, SpaceConfig, SpaceState };
