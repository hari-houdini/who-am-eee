import type {
  Cards,
  Label,
  SpaceConfig,
  SpaceState,
} from './hyper.types';

const INITIAL_SPACE_STATE: SpaceState = {
  scroll: 0,
  targetSpeed: 0,
  velocity: 0,
  mouseX: 0,
  mouseY: 0,
};

const SPACE_CONFIG: SpaceConfig = {
  starCount: 150,
  zGap: 1_200,
  camSpeed: 2.5,
  colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff'],

  get loopSize() {
    return (
      (Object.values(LABELS).length +
        [...Object.values(CARDS)].flat().length) *
      SPACE_CONFIG.zGap
    );
  },
};

const LABELS: Label = {
  above_the_fold: {
    text: 'Hari Houdini',
  },
  about: {
    text: 'Full Stack Dev',
  },
  tech_stack: {
    text: 'Creative Coder',
  },
  projects: {
    text: 'Open to Work',
  },
  job_stats: {
    text: 'Job Stats',
  },
  spotify: {
    text: 'Spotify',
  },
  contact: {
    text: "Let's Build",
  },
  footer: {
    text: 'Footer',
  },
};

const CARDS: Cards = {
  above_the_fold: [
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
  ],
  about: [
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
  ],
  tech_stack: [
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
  ],
  projects: [
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
  ],
  job_stats: [
    {
      id: 'PROJ.005',
      title: 'Job Stats',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      size: 'l',
    },
  ],
  spotify: [
    {
      id: 'PROJ.006',
      title: 'Spotify',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      size: 'l',
    },
  ],
  contact: [
    {
      id: 'PROJ.007',
      title: 'Contact',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      size: 'l',
    },
  ],
  footer: [
    {
      id: 'PROJ.008',
      title: 'Footer',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      size: 'l',
    },
  ],
};

export { CARDS, INITIAL_SPACE_STATE, LABELS, SPACE_CONFIG };
