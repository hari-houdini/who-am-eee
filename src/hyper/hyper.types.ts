/**
 * const INITIAL_SPACE_STATE = {
  scroll: 0,
  targetSpeed: 0,
  velocity: 0,
  mouseX: 0,
  mouseY: 0,
};

const SPACE_CONFIG = {
  starCount: 150,
  zGap: 1_600,
  loopSize: 10_000,
  camSpeed: 2.5,
  colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff'],
};

const LABELS = [
  'Hari Houdini',
  'Full Stack Dev',
  'Creative Coder',
  'Open to Work',
  "Let's Build",
];

const CARDS = [
  {
    id: 'PROJ.001',
    title: 'Who Am Eee',
    tags: ['TypeScript', 'WebGL'],
    year: '2025',
    x: 600,
    z: -800,
    rotation: -5,
    size: 's',
  },
  {
    id: 'PROJ.002',
    title: 'Project Alpha',
    tags: ['React', 'Bun'],
    year: '2024',
    x: -600,
    z: -2400,
    rotation: 5,
    size: 'm',
  },
  {
    id: 'PROJ.003',
    title: 'Dark Matter',
    tags: ['Python', 'ML'],
    year: '2024',
    x: 600,
    z: -4000,
    rotation: -3,
    size: 'l',
  },
  {
    id: 'PROJ.004',
    title: 'Void Runner',
    tags: ['Rust', 'WASM'],
    year: '2023',
    x: -600,
    z: -5600,
    rotation: 4,
    size: 'l',
  },
];
 */

type Label = Record<
  string,
  {
    text: string;
    description?: string;
  }
>;

type Card = {
  id: string;
  title: string;
  tags: string[];
  year: string;
  x?: number;
  y?: number;
  z?: number;
  rotation: number;
  size: 's' | 'm' | 'l';
};

type Cards = Record<string, Card[]>;

type SpaceState = {
  scroll: number;
  targetSpeed: number;
  velocity: number;
  mouseX: number;
  mouseY: number;
};

type SpaceConfig = {
  itemCount: number;
  starCount: number;
  zGap: number;
  loopSize: number;
  camSpeed: number;
  colors: string[];
};

export type { Card, Cards, Label, SpaceConfig, SpaceState };
