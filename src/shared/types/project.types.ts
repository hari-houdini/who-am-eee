/**
 * A single portfolio project with metadata, progress tracking, and a GitHub URL.
 *
 * @remarks
 * Keys in {@link PROJECT_INFO} must match the `id` field of the corresponding
 * `Card` entry in `hyper.const.ts` (e.g. `'PROJ.REPOS.001'`).
 */
type Project = {
	/** Short one-line description shown as the tab panel tagline. */
	tagline: string;
	/** Full prose paragraph displayed in the Description tab. */
	description: string;
	/** Display title matching the card heading. */
	title: string;
	/** Year string shown in the card footer. */
	year: string;
	/** What was learned while building the project. */
	learnings: string;
	/** What the project aims to learn or complete next. */
	aim: string;
	/** Technology tags. */
	tags: string[];
	/** GitHub repository URL used by the "View on GitHub" link. */
	url: string;
	/** Completion percentage 0–100 rendered in the circular progress ring. */
	progress: number;
};

export type { Project };
