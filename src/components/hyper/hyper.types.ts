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
 * A single portfolio card rendered in the 3D hyper-space scene.
 * Coordinates are in 3D scene units relative to the viewport centre.
 */
type Card = {
  /** Unique identifier displayed in the card header (e.g. `'PROJ.001'`). */
  id: string;
  /** Title rendered as the card heading. */
  title: string;
  /** Technology or topic tags shown in the card footer. */
  tags: string[];
  /** Year string shown in the card footer. */
  year: string;
  /** Horizontal offset in pixels from the scene origin. Defaults to 0. */
  x?: number;
  /** Vertical offset in pixels from the scene origin. Defaults to 0. */
  y?: number;
  /**
   * Depth offset in the Z axis.
   * @remarks Calculated automatically by the animation system; setting this
   * manually has no effect at runtime.
   */
  z?: number;
  /** HTML string for the card body content, parsed via DOMParser. */
  content: string;
  /** Initial rotation of the card in degrees around the Z axis. */
  rotation: number;
  /**
   * Visual size variant controlling card dimensions.
   * - `'s'` — 25vw wide (compact)
   * - `'m'` — 40vw wide (standard)
   * - `'l'` — 50vw wide (full)
   */
  size: 's' | 'm' | 'l';
};

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
  /** Raw scroll position in pixels from Lenis. */
  scroll: number;
  /** Target scroll speed set by the Lenis scroll event. */
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
  /** Number of star particles to generate. */
  starCount: number;
  /** Z-axis gap in pixels between consecutive scene items. */
  zGap: number;
  /** Total Z depth of the scene before it loops. Computed as `itemCount * zGap`. */
  loopSize: number;
  /** Multiplier applied to the scroll position to derive camera Z. */
  camSpeed: number;
  /** Palette used for chromatic aberration effects. */
  colors: string[];
};

export type { Card, Cards, Label, SpaceConfig, SpaceState };
