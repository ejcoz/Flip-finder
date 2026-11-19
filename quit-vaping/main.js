// "You quit vaping" — a Pixel Scan film. The film is data; engine.js draws it. Facts: FACTS.md.
import { film } from './engine.js';
import { C } from './bit.js';

// lungs, liver, stomach, muscle stay unchanged: this film makes no claims about them (FACTS.md)
const BODY = { lung: 1, liver: 1, stomach: 1, muscle: 1 };
const HEAD_SPARKS = [[-6, 3], [7, 2], [-8, 9], [6, 10]];

// readout: nicotine in the blood, halving on the 2-hour clock (one half-life per beat while counting)
const READ = {
  label: 'NICOTINE', unit: 'IN BLOOD', suffix: '%', startCol: C.amber,
  better: v => v < 100, bar: v => v / 100,
  step: (a, b, steps) => b === 0 ? (steps >= 6 ? 0 : Math.round(a / 2 ** steps)) : Math.max(b, Math.round(a / 2 ** steps)),
};

const MS = [
  { bars: 2, hook: [['YOU QUIT', 10], ['VAPING.', 14], ["HERE'S WHAT HAPPENS", 6]], hookX: true, mood: 'groove', dir: 0, read: [100, 100], props: ['vapeX', 'vapor'],
    s: { ...BODY, brain: .3, heart: .45, face: 'flat', toxins: 26 } },
  { bars: 2, title: 'HOUR 2', cap: ['HALF YOUR', 'NICOTINE IS GONE'], mood: 'groove', dir: 1, read: [100, 50],
    label: { organ: 'HEART', say: ['NICOTINE', 'WEARING OFF'], at: [13.5, 24.5] },
    s: { ...BODY, brain: .3, heart: .7, face: 'flat', toxins: 13 } },
  { bars: 2, title: 'DAYS 1-3', cap: ['WITHDRAWAL PEAKS:', 'CRAVINGS, BAD SLEEP'], mood: 'stripped', dir: -1, read: [50, 0], props: ['sweat'], shake: true,
    label: { organ: 'BRAIN', say: ['CRAVES', 'NICOTINE'], at: [11.5, 4] },
    away: { kind: 'bed', at: 0, state: { lung: 1, liver: 1, stomach: 1, muscle: 1, brain: .15, heart: .8, face: 'wide', toxins: 0 } },
    s: { ...BODY, brain: .15, heart: .8, face: 'wide', toxins: 0 } },
  { bars: 2, title: 'WHY SO HARD?', cap: ['YOUR BRAIN GREW', 'EXTRA RECEPTORS'], mood: 'groove', dir: -1, read: [0, 0],
    lens: { n: 18, col: C.amber, head: 'RECEPTORS', foot: 'TOO MANY' },
    s: { ...BODY, brain: .2, heart: .85, face: 'tired', toxins: 0 } },
  { bars: 2, title: 'WEEKS 1-4', cap: ['CRAVINGS FADE', 'OVER A MONTH'], mood: 'groove', dir: 1, read: [0, 0],
    away: { kind: 'chart', at: 0, chart: { label: 'URGE', x: 'WEEKS', down: true, pts: [.45, .95, .88, .72, .6, .48, .4, .33, .26, .2, .16] } },
    s: { ...BODY, brain: .5, heart: .9, face: 'flat', toxins: 0 } },
  { bars: 2, title: 'WEEKS 6-12', cap: ['RECEPTORS BACK', 'TO NORMAL'], mood: 'groove', dir: 1, read: [0, 0], coin: true,
    lens: { n: 7, col: C.lime, head: 'RECEPTORS', foot: 'NORMAL' }, sparkle: HEAD_SPARKS,
    s: { ...BODY, brain: .9, heart: 1, face: 'flat', toxins: 0 } },
  { bars: 3, title: 'MONTH 3+', cap: ['LESS ANXIETY,', 'LESS STRESS'], mood: 'groove', drop: true, dir: 1, read: [0, 0], punch: true, focus: 'head', sparkle: HEAD_SPARKS,
    s: { ...BODY, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
  { bars: 3, title: "YOU'RE FREE", cap: ['SEND THIS TO', 'SOMEONE QUITTING'], mood: 'triumph', dir: 1, read: [0, 0], final: true, sparkle: HEAD_SPARKS,
    s: { ...BODY, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
];

film({ MS, READ });
