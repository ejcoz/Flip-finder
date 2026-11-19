// "You cut added sugar" — a Pixel Scan film. The film is data; engine.js draws it. Facts: FACTS.md.
// Organs stay as they are (this film makes no organ claims); the amber particles stand for sugar and are illustrative.
import { film } from './engine.js';
import { C, showOnly, particles } from './bit.js';
showOnly([]);   // only the organs this film talks about
particles('cube');   // the particles are sugar cubes (illustrative)

const BODY = { lung: 1, heart: 1, brain: 1, liver: 1, stomach: 1, muscle: 1 };
const HEAD_SPARKS = [[-6, 3], [7, 2], [-8, 9], [6, 10]];

// readout: grams of added sugar in a day (an illustrative day; the 25 g line is the WHO's ideal)
const READ = {
  label: 'SUGAR', unit: 'PER DAY', suffix: 'G', startCol: C.amber,
  better: v => v <= 25, bar: v => Math.min(1, v / 60),
  step: (a, b, steps) => Math.max(b, a - steps * 10),
};

const MS = [
  { bars: 2, hook: [['YOU CUT', 10], ['ADDED SUGAR.', 12], ["HERE'S WHAT HAPPENS", 6]], hookX: true, mood: 'groove', dir: 0, read: [60, 60], props: ['sodaX'],
    s: { ...BODY, face: 'flat', toxins: 26 } },
  { bars: 2, title: 'DAY 1', cap: ['UNDER 25G A DAY', 'IS THE W.H.O. IDEAL'], mood: 'groove', dir: 1, read: [60, 20],
    away: { kind: 'kitchen', at: 0, state: { ...BODY, face: 'flat', toxins: 10 } },
    s: { ...BODY, face: 'flat', toxins: 10 } },
  { bars: 2, title: 'WHERE IT HIDES', cap: ['DRINKS ARE THE', 'BIGGEST SOURCE'], mood: 'stripped', dir: -1, read: [20, 20], props: ['bang'],
    tags: [['DESSERTS', '#FF9BB0'], ['CEREAL', '#FFB547'], ['CANDY', '#B9A6FF'], ['SODA', '#FF7A6B']],
    s: { ...BODY, face: 'wide', toxins: 14 } },
  { bars: 2, title: 'WEEK 1', cap: ['LESS FUEL FOR', 'TOOTH DECAY'], mood: 'groove', dir: 1, read: [20, 20],
    mech: { kind: 'tooth', legend: [['BACTERIA EAT SUGAR', '#7CE06A']] },
    s: { ...BODY, face: 'happy', toxins: 4 } },
  { bars: 2, title: 'MONTH 3', cap: ['FOOD TASTES', '~40% SWEETER'], mood: 'groove', dir: 1, read: [20, 20], coin: true,
    away: { kind: 'chart', at: 0, chart: { label: 'SWEETNESS', x: 'MONTHS', pts: [.2, .22, .28, .35, .42, .5, .56, .64, .72, .8, .86] } },
    s: { ...BODY, face: 'happy', toxins: 0 } },
  { bars: 2, title: 'GO BACK?', cap: ['YOUR TASTE', 'BOUNCES BACK FAST'], mood: 'stripped', dir: -1, read: [20, 60], props: ['bang'], shake: true,
    s: { ...BODY, face: 'wide', toxins: 18 } },
  { bars: 3, title: 'STICK WITH IT', cap: ['THE RESET LASTS', 'WHILE YOU DO'], mood: 'groove', drop: true, dir: 1, read: [20, 20], punch: true, focus: 'head', sparkle: HEAD_SPARKS,
    s: { ...BODY, face: 'happy', toxins: 0 } },
  { bars: 3, title: 'SWEET!', cap: ['SEND THIS TO', 'A SWEET TOOTH'], mood: 'triumph', dir: 1, read: [20, 20], final: true, sparkle: HEAD_SPARKS,
    s: { ...BODY, face: 'happy', toxins: 0 } },
];

film({ MS, READ });
