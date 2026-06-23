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
	/**
	 * Custom element tag name for the card body.
	 * `'about-me'` renders the `<about-me>` biography component.
	 * `'tech-skills'` renders the `<tech-skills>` technology stack grid.
	 * `'management-skills'` renders the `<management-skills>` methodology grid.
	 * `'photo-gallery'` renders the `<photo-gallery>` dog photo gallery.
	 * Omit for generic HTML content.
	 */
	bodyTag?:
		| "about-me"
		| "tech-skills"
		| "management-skills"
		| "forbidden-space"
		| "social-space"
		| "photo-gallery";
	/** HTML string for the card body content, parsed via DOMParser. */
	content: string;
	/**
	 * When `true`, clicking the card opens a `<card-modal>` overlay.
	 * Cards without this property are not interactive.
	 */
	modal?: boolean;
	/** Initial rotation of the card in degrees around the Z axis. */
	rotation: number;
	/**
	 * Visual size variant controlling card dimensions.
	 * - `'s'` — 25vw wide (compact)
	 * - `'m'` — 40vw wide (standard)
	 * - `'l'` — 50vw wide (full)
	 */
	size: "s" | "m" | "l";
};

export type { Card };
