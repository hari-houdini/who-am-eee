import type { Cards, Label, SpaceConfig, SpaceState } from "./hyper.types";

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
 * Static scene configuration used by {@link initWorld} and the RAF loop.
 *
 * @remarks
 * `itemCount` and `loopSize` are computed getters — they reflect the current
 * state of {@link LABELS} and {@link CARDS} and must not be set manually.
 */
const SPACE_CONFIG: SpaceConfig = {
	starCount: 150,
	zGap: 1_200,
	camSpeed: 2.5,
	colors: ["#ff003c", "#00f3ff", "#ccff00", "#ffffff"],

	/** Total item count across all scene labels and their associated cards. */
	get itemCount() {
		return Object.values(LABELS).length + Object.values(CARDS).flat().length;
	},

	/** Total Z depth of the looping scene in pixels. */
	get loopSize() {
		return this.itemCount * this.zGap;
	},
};

/**
 * Named scene sections with display text and optional taglines.
 * Each key corresponds to a depth position in the scene and optionally
 * to an entry in {@link CARDS}.
 */
const LABELS: Label = {
	above_the_fold: {
		text: "Hari H🍑udini",
	},
	about: {
		text: "whoami",
	},
	tech_stack: {
		text: "Capabilities",
		description: "(Self reported!)",
	},
	projects: {
		text: "Incomplete Projects",
	},
	timeline: {
		text: "Life in a fast lane",
	},
	job_stats: {
		text: "Skill Issue",
	},
	spotify: {
		text: "I'm feeling lucky.mp3",
	},
	// testimonials: {
	//   text: 'Victim Statements',
	// },
	contact: {
		text: "Wanna be the next victim?",
		description: "Seriously, Employ me!",
	},
	footer: {
		text: "You actually scrolled this far?",
		description: "Congrats, you hit rock bottom",
	},
	truman_show: {
		text: "In case I dont see ya...",
		description: "Good afternoon, Good evening and Good night",
	},
};

/**
 * Portfolio cards indexed by the section key they appear in.
 * Cards within a section are placed at consecutive Z positions after the
 * section's label, each offset by {@link SpaceConfig.zGap}.
 */
const CARDS: Cards = {
	about: [
		{
			id: "PROJ.SUMMARY",
			title: "Eight years into this circus",
			tags: ["Senior Web Engineer", "TypeScript", "AWS", "Docker"],
			year: "since 2018",
			x: 0,
			bodyTag: "about-me" as const,
			content: "",
			modal: true,
			rotation: 4,
			size: "l",
		},
	],
	tech_stack: [
		{
			id: "PROJ.TECHNICAL",
			title: "Dark Matter",
			tags: ["TypeScript Engineer", "Frontend", "Backend", "Cloud"],
			year: "** Non-Exhaustive List",
			x: 60,
			rotation: -4,
			bodyTag: "tech-skills" as const,
			content: "",
			modal: true,
			size: "l",
		},
		{
			id: "PROJ.MANAGEMENT",
			title: "Grey Matter",
			tags: ["Mid-Level", "Senior"],
			year: "Since 2020",
			x: -60,
			rotation: 3,
			bodyTag: "management-skills" as const,
			content: "",
			modal: true,
			size: "l",
		},
	],
	projects: [
		{
			id: "PROJ.REPOS.001",
			title: "Gone Bad",
			tags: [
				"Expo SDK 52",
				"React Native",
				"Supabase (Postgres, pgvector, Storage, Auth, Edge Functions)",
				"Google Gemini 2.0 Flash",
				"RAG pipeline",
			],
			year: "est. 03/2026",
			x: -100,
			rotation: -3,
			modal: true,
			content:
				"<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>",
			size: "l",
		},
		{
			id: "PROJ.REPOS.002",
			title: "The Royal Ruse",
			tags: [
				"Godot 4.3",
				"Hexagonal Architecture (Ports and Adapters)",
				"GUT (testing)",
				"Docker",
			],
			year: "est. 04/2026",
			x: 100,
			rotation: 3,
			modal: true,
			content:
				"<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>",
			size: "l",
		},
		{
			id: "PROJ.REPOS.003",
			title: "Yo Mama",
			tags: ["Angular 19", "RxJS", "SSR/SSG", "Rust", "Decorator Pattern"],
			year: "est. 01/2025",
			x: -100,
			rotation: -3,
			modal: true,
			content:
				"<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>",
			size: "l",
		},
	],
	job_stats: [
		{
			id: "PROJ.JOB_APPLICATIONS",
			title: "Luck so far",
			tags: ["Ghostings", "Rejections", "Pending"],
			year: "Sign an NDA to unlock",
			x: 0,
			rotation: -4,
			bodyTag: "forbidden-space" as const,
			content: "",
			size: "s",
		},
	],
	spotify: [
		{
			id: "PROJ.006",
			title: "Spotify",
			tags: ["Python", "ML"],
			year: "2024",
			x: 0,
			rotation: 2,
			content:
				"<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>",
			size: "l",
		},
	],
	// testimonials: [
	//   {
	//     id: 'PROJ.TESTIMONIALS',
	//     title: 'Testimonials',
	//     tags: ['Python', 'ML'],
	//     year: '2024',
	//     x: 0,
	//     rotation: -2,
	//     content:
	//       '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
	//     size: 'l',
	//   },
	// ],
	timeline: [
		{
			id: "PROJ.TIMELINE",
			title: "Life in a fast lane",
			tags: ["Zoho", "MISDI", "Pixel Toys", "ECE"],
			year: "2014 – present",
			x: 0,
			rotation: -2,
			bodyTag: "career-timeline" as const,
			content: "",
			modal: true,
			size: "l",
		},
	],
	contact: [
		{
			id: "PROJ.SOCIALS",
			title: "Lets talk business!",
			tags: ["Not active on Facebook"],
			year: "mailto:hariharasudhanshaktivel@gmail.com",
			x: 0,
			rotation: 3,
			bodyTag: "social-space" as const,
			content: "",
			modal: true,
			size: "m",
		},
	],
	footer: [
		{
			id: "PROJ.GALLERY",
			title: "Here's your gift",
			tags: ["Good Girl", "Very Important"],
			year: "2024",
			x: 0,
			rotation: 0,
			bodyTag: "photo-gallery" as const,
			content: "",
			modal: true,
			size: "l",
		},
	],
};

export { CARDS, INITIAL_SPACE_STATE, LABELS, SPACE_CONFIG };
