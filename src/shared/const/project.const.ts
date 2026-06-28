import type { Project } from '../types/project.types';

/**
 * Static project metadata keyed by card ID (e.g. `'PROJ.REPOS.001'`).
 * Consumed by `<project-tabs>` to populate tab content, progress ring, and GitHub link.
 *
 * @remarks
 * Each key must match the `id` of the corresponding `Card` entry in `hyper.const.ts`.
 * Progress values are 0–100 (percentage complete).
 */
const PROJECT_INFO: Record<string, Project> = {
  'PROJ.REPOS.001': {
    title: 'Gone Bad',
    progress: 30,
    tagline:
      'A food expiry tracker that judges you for letting things rot.',
    description:
      "An app that tracks what's in your fridge, get notified before it goes bad, to stop wasting food. It would have AI-powered photo recognition, a RAG pipeline, multi-user kitchens, and notifications written to roast users for forgetting about that lettuce. The scope crept. I let it.",
    year: 'est. 03/2026',
    learnings:
      'Designing a RAG pipeline from scratch (chunking strategy, embedding generation, retrieval logic) and how much planning it takes before a single line of production code gets written.',
    aim: 'Create a full fledged mobile/web application and learn how to launch in app/play stores. Also, image processing pipelines, and planning zero-cost architecture.',
    tags: [
      'Expo SDK 52',
      'React Native',
      'Supabase (Postgres, pgvector, Storage, Auth, Edge Functions)',
      'Google Gemini 2.0 Flash',
      'RAG pipeline',
    ],
    url: 'https://github.com/hari-houdini/gone-bad',
  },
  'PROJ.REPOS.002': {
    title: 'Me Portfolio',
    progress: 70,
    tagline:
      'A not-so-serious portfolio site because market demands me to have one.',
    description:
      "A plain HTML/CSS/JS portfolio site with a few pages of content. It's not a real portfolio, but it's a portfolio. I'm not sure what I'm doing with it, but I'm trying to learn some new things.",
    year: 'est. 06/2026',
    learnings:
      'Native web components (shadow DOM, custom elements), and how to use them to build a simple, self-contained, reusable component library and a few more... well, I guess I could say that.',
    aim: 'Understand JS environments (in this case, BunJS), bundlers, etc and how a framework like Astro works, but implementing everything using vanilla JS.',
    tags: [
      'Shadow DOM',
      'BunJS',
      'Cloudflare',
      'Content Security Policy (CSP)',
      'Search Engine Optimization (SEO)',
    ],
    url: 'https://github.com/hari-houdini/who-am-eee',
  },
  'PROJ.REPOS.003': {
    title: 'Yo Mama',
    progress: 50,
    tagline:
      'An AI roast battle app. The one project that actually shipped something.',
    description:
      "Built to let users battle Gemini AI in 'yo mama' roast exchanges, using Angular 19's SSR/SSG. Beta-tested with me friends. The planned Rust backend never happened (it's still on the to-do list) but the frontend made it further than I expected.",
    year: 'est. 01/2025',
    learnings:
      "Angular's SSR setup in a real project, understanding Typescript decorators, and how to performance-tune for Core Web Vitals",
    aim: "Building and integrating a Rust backend with a TypeScript frontend, and what it actually takes to go from 'work-in-progress' to 'shippable'.",
    tags: [
      'Angular 19',
      'RxJS',
      'SSR/SSG',
      'Rust',
      'Decorator Pattern',
    ],
    url: 'https://github.com/hari-houdini/yo-mama',
  },
};

export { PROJECT_INFO };
