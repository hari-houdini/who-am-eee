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

  get itemCount() {
    return (
      Object.values(LABELS).length +
      Object.values(CARDS).flat().length
    );
  },

  get loopSize() {
    return this.itemCount * this.zGap;
  },
};

const LABELS: Label = {
  above_the_fold: {
    text: 'Hari H🍑udini',
  },
  about: {
    text: 'whoami',
  },
  tech_stack: {
    text: 'Capabilities',
    description: '(Self reported!)',
  },
  projects: {
    text: 'Incomplete Projects',
  },
  job_stats: {
    text: 'Skill Issue',
  },
  spotify: {
    text: 'Now Playing.mp3',
  },
  testimonials: {
    text: 'Victim Statements',
  },
  contact: {
    text: 'Wanna be the next victim?',
    description: 'Seriously, Employ me!',
  },
  footer: {
    text: 'You actually scrolled this far?',
    description: 'Congrats, you hit rock bottom',
  },
};

const CARDS: Cards = {
  about: [
    {
      id: 'PROJ.SUMMARY',
      title: 'Eight years into this circus',
      tags: ['Senior Web Engineer', 'TypeScript', 'AWS', 'Docker'],
      year: 'since 2018',
      x: -600,
      z: -2400,
      content: `
          <p>Meet Hariharasudhan Shaktivel, a tragically misguided soul who abandoned the objective reality of hardware circuits to willingly subjugate himself to the sadistic whims of the TypeScript and AWS. No one asked him to do this, and frankly, someone should have intervened.</p>
          <p>He spent years at Zoho pretending he actually enjoyed the phrase "at scale," before voluntarily fleeing across an ocean to Pixel Toys in the UK—presumably to find out if European servers throw more polite exceptions. There, he has dedicated his prime adult years to violently bullying web bundlers into submission and making web apps faster for users who absolutely do not care.</p>
          <p>Has a food expiry tracker called Gone Bad that may or may not expire before it ships, a social deduction card game called The Royal Ruse that is one Godot crash away from being someone else's problem, and a design patterns encyclopedia spanning 97 patterns across 9 families, because apparently "just applying to jobs" felt too straightforward.</p>
          <p>His free time is an absolute masterclass in productive avoidance. He builds hopelessly convoluted learning roadmaps and meticulously entombs useless interview trivia within an impenetrable Obsidian vault, achieving peak meta-work just to avoid writing a single line of actionable code for his side projects..</p>
          <p>He is, by all accounts, a Senior Engineer who is one well-timed deadline away from actually shipping something.</p>


          <em>Yeah, that’s me, a walking type-checking error completely devoid of a release strategy, and honestly? I'd do it all again. Probably am.</em>
        `,
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
      content: `
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>
      `,
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
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
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
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
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
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
      size: 'l',
    },
  ],
  testimonials: [
    {
      id: 'PROJ.007',
      title: 'Testimonials',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
      size: 'l',
    },
  ],
  contact: [
    {
      id: 'PROJ.008',
      title: 'Contact',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
      size: 'l',
    },
  ],
  footer: [
    {
      id: 'PROJ.009',
      title: 'Footer',
      tags: ['Python', 'ML'],
      year: '2024',
      x: 600,
      z: -4000,
      rotation: -3,
      content:
        '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl. Nullam euismod, nisl eget ultricies ultrices, nunc nisi aliquet nisl, eu tincidunt nisi nisl eu nisl.</p>',
      size: 'l',
    },
  ],
};

export { CARDS, INITIAL_SPACE_STATE, LABELS, SPACE_CONFIG };
