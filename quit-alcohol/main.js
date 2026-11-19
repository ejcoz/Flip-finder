// "You stop drinking" — a Pixel Scan film. The film is data; engine.js draws it. Facts: FACTS.md.
import { film } from './engine.js';
import { C } from './bit.js';

const HEAD_SPARKS = [[-6, 3], [7, 2], [-8, 9], [6, 10]];
const BELLY_SPARKS = [[-9, 30], [8, 33], [-6, 3], [7, 22]];

// readout: alcohol in the blood, cleared at a steady rate (the liver handles roughly one drink an hour)
const READ = {
  label: 'ALCOHOL', unit: 'IN BLOOD', suffix: '%', startCol: C.amber,
  better: v => v < 100, bar: v => v / 100,
  step: (a, b, steps) => Math.max(b, a - steps * 15),
};

const MS = [
  { bars: 2, hook: [['YOU STOP', 10], ['DRINKING.', 14], ["HERE'S WHAT HAPPENS", 6]], hookX: true, mood: 'groove', dir: 0, read: [100, 100], props: ['drinkX'],
    s: { lung: 1, muscle: 1, liver: .2, stomach: .55, brain: .35, heart: .55, face: 'tired', toxins: 22 } },
  { bars: 2, title: 'DAY 1', cap: ['YOUR LIVER CLEARS', 'ABOUT 1 DRINK/HOUR'], mood: 'groove', dir: 1, read: [100, 0],
    label: { organ: 'LIVER', say: ['CLEARING', 'ALCOHOL'], at: [11.5, 32] },
    s: { lung: 1, muscle: 1, liver: .35, stomach: .6, brain: .35, heart: .6, face: 'flat', toxins: 8 } },
  { bars: 2, title: 'DAYS 2-3', cap: ['SLEEP CAN BE', 'ROUGH AT FIRST'], mood: 'stripped', dir: -1, read: [0, 0], props: ['sweat'], shake: true,
    label: { organ: 'BRAIN', say: ['RESETTING', 'SLEEP'], at: [11.5, 4] },
    s: { lung: 1, muscle: 1, liver: .45, stomach: .65, brain: .25, heart: .6, face: 'wide', toxins: 0 } },
  { bars: 2, title: 'HEAVY DRINKER?', cap: ['TALK TO A DOCTOR', 'BEFORE YOU STOP'], mood: 'groove', dir: -1, read: [0, 0], props: ['bang'],
    s: { lung: 1, muscle: 1, liver: .45, stomach: .65, brain: .3, heart: .6, face: 'flat', toxins: 0 } },
  { bars: 2, title: 'WEEKS 1-2', cap: ['7 IN 10 SAY THEY', 'SLEPT BETTER'], mood: 'groove', dir: 1, read: [0, 0],
    chart: { label: 'SLEEP', x: 'WEEKS', pts: [.2, .18, .3, .38, .35, .5, .58, .55, .7, .78, .85] },
    s: { lung: 1, muscle: 1, liver: .6, stomach: .75, brain: .7, heart: .7, face: 'flat', toxins: 0 } },
  { bars: 2, title: 'WEEK 4', cap: ['BLOOD PRESSURE', 'AND SUGAR IMPROVE'], mood: 'groove', dir: 1, read: [0, 0], coin: true, sparkle: BELLY_SPARKS,
    label: { organ: 'HEART', say: ['PRESSURE', 'DOWN ~6%'], at: [13.5, 24.5] },
    s: { lung: 1, muscle: 1, liver: .85, stomach: .9, brain: .85, heart: 1, face: 'flat', toxins: 0 } },
  { bars: 3, title: 'MONTH 1', cap: ['MORE ENERGY,', 'MORE CONTROL'], mood: 'groove', drop: true, dir: 1, read: [0, 0], punch: true, focus: 'head', sparkle: HEAD_SPARKS,
    s: { lung: 1, muscle: 1, liver: 1, stomach: 1, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
  { bars: 3, title: 'YOU DID IT!', cap: ['TAG YOUR', 'DRINKING BUDDY'], mood: 'triumph', dir: 1, read: [0, 0], final: true, sparkle: HEAD_SPARKS,
    s: { lung: 1, muscle: 1, liver: 1, stomach: 1, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
];

film({ MS, READ });
