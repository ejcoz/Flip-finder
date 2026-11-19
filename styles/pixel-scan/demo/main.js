// Pixel Scan demo: "10K steps a day". The film is data; engine.js draws it.
// Captions, callouts and numbers here are placeholder copy for a style test (see ../FACTS.md).
import { film } from './engine.js';
import { C } from './bit.js';

const HEALTHY = { lung: 1, heart: 1, brain: 1, liver: 1, stomach: 1, muscle: 1, toxins: 0 };
const SPARKS = [[-9, 25], [9, 47], [-8, 52], [7, 3]];

const READ = {
  label: 'PULSE', unit: 'BPM', suffix: '', startCol: '#F2FBFC',
  better: v => v < 84, bar: null,
  step: (a, b, steps) => Math.max(b, a - steps * 2),
};

const MS = [
  { bars: 2, hook: [['YOU WALK', 10], ['10K STEPS.', 13], ["HERE'S WHAT HAPPENS", 6]], mood: 'groove', dir: 0, read: [84, 84], props: ['bang'],
    s: { lung: .25, heart: .3, brain: .3, liver: .45, stomach: .5, muscle: .1, face: 'tired', toxins: 16 } },
  { bars: 2, title: 'WEEK 1', cap: ['MUSCLES ADAPT TO', 'THE NEW LOAD'], mood: 'stripped', dir: -1, read: [84, 84], props: ['sweat'], shake: true,
    label: { organ: 'LEG MUSCLES', say: ['MICRO-TEARS', 'REBUILDING'], at: [11.5, 46] },
    s: { lung: .3, heart: .35, brain: .35, liver: .5, stomach: .55, muscle: .1, face: 'wide', toxins: 13, sore: true } },
  { bars: 2, title: 'WEEKS 2-8', cap: ['MORE ENERGY,', 'LESS FATIGUE'], mood: 'groove', dir: 1, read: [84, 80],
    away: { kind: 'chart', at: 0, chart: { label: 'ENERGY', x: 'WEEKS', pts: [.1, .16, .13, .28, .36, .31, .5, .6, .56, .76, .9] } },
    s: { lung: .5, heart: .55, brain: .5, liver: .7, stomach: .75, muscle: .5, face: 'flat', toxins: 7 } },
  { bars: 2, title: 'MONTH 2', cap: ['ACTIVE DAYS,', 'DEEPER SLEEP'], mood: 'groove', dir: 1, read: [80, 76], props: ['zzz'], sparkle: SPARKS,
    label: { organ: 'BRAIN', say: ['RECOVERS', 'OVERNIGHT'], at: [11.5, 4] },
    s: { lung: .7, heart: .7, brain: 1, liver: .85, stomach: .9, muscle: .8, face: 'shut', toxins: 3 } },
  { bars: 3, title: 'MONTH 3', cap: ['RESTING HEART', 'RATE DROPS'], mood: 'groove', drop: true, dir: 1, read: [76, 68], coin: true, punch: true, focus: 'chest', sparkle: SPARKS,
    label: { organ: 'HEART', say: ['PUMPS MORE', 'PER BEAT'], at: [13.5, 24.5] },
    away: { kind: 'dive', at: 0, organ: 'heart', health: [.85, 1], gauge: [.62, .3], gaugeLabel: 'PULSE' },
    s: { ...HEALTHY, face: 'happy' } },
  { bars: 3, title: 'LEVEL UP!', cap: ['SAVE THIS FOR', 'YOUR DAY 1'], mood: 'triumph', dir: 1, read: [68, 68], final: true, sparkle: SPARKS,
    s: { ...HEALTHY, face: 'happy' } },
];

film({ MS, READ });
