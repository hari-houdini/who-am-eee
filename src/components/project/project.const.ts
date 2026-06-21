import type { Project } from './project.types';

/**
 * Projects that I've worked on, with their current progress and learnings.
 * Each project has a unique identifier (e.g. `'PROJ.REPOS.001'`) and a
 * corresponding {@link Project} object.
 */
const PROJECT_INFO: Record<string, Project> = {
  'PROJ.REPOS.001': {
    title: 'Gone Bad',
    progress: 30,
    tagline:
      'A food expiry tracker that judges you for letting things rot.',
    description:
      "He started this one with good intentions. To track what's in your fridge, get notified before it goes bad, stop wasting food. Then it grew. Now it has AI-powered photo recognition, a RAG pipeline, multi-user kitchens, and notifications written to roast you for forgetting about that lettuce. The scope crept. He let it.",
    year: 'est. 03/2026',
    learnings:
      'Designing a RAG pipeline from scratch (chunking strategy, embedding generation, retrieval logic) and how much planning it takes before a single line of production code gets written.',
    aim: 'Whether a 20-section TDD survives first contact with an actual build. Also, image processing pipelines, and keeping AI API costs near zero on a free-tier architecture.',
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
    title: 'The Royal Ruse',
    progress: 10,
    tagline:
      'A social deduction card game that exists mostly as documentation right now.',
    description:
      "A reimagining of the childhood game Raja Rani Police Thief, except now it has ten roles, a power-up system, blind alliances, and a Hexagonal Architecture diagram nobody asked for. He's written the Technical Design Document, seven phase-by-phase PRDs, and agent instruction files. He has not written the game.",
    year: 'est. 04/2026',
    learnings:
      'How far over-planning can go before any code exists. Turns out: pretty far.',
    aim: "Godot's node system and game loop in practice (not just in the design doc), server-authoritative game logic, and whether Hexagonal Architecture is worth it for a project this size or just a fun word to use in interviews.",
    tags: [
      'Godot 4.3',
      'Hexagonal Architecture (Ports and Adapters)',
      'GUT (testing)',
      'Docker',
    ],
    url: 'https://github.com/hari-houdini/the-royal-ruse',
  },
  'PROJ.REPOS.003': {
    title: 'Yo Mama',
    progress: 60,
    tagline:
      'An AI roast battle app. The one project that actually shipped something.',
    description:
      "Built to let users battle Gemini AI in 'yo mama' roast exchanges, using Angular 19's SSR/SSG. Beta-tested with real concurrent users and real performance numbers. The planned Rust backend never happened (it's still on the to-do list) but the frontend made it further than the other two combined.",
    year: 'est. 01/2025',
    learnings:
      "Angular's SSR/SSG setup in a real project (not a tutorial), and how to performance-tune for Core Web Vitals",
    aim: "Building and integrating a Rust backend with a TypeScript frontend, and what it actually takes to go from 'beta with good numbers' to 'shipped.'",
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
