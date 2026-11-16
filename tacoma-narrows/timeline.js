// One timeline for picture, sound and subtitles. 90 bpm, bar = 8/3 s.
export const BPM = 90, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const T = {
  S2: 2 * BAR,          // 5.333  dimensions, track along the cable
  S3: 4 * BAR,          // 10.667 cut: wind, oblique opens
  secDraw: 11.0,
  twist0: 12.0,
  openNote: 8.6,
  snap: 7 * BAR,        // 18.667 the break (on "ripped")
  stamp: 8 * BAR,       // 21.333 red stamp
  fig: 9 * BAR,         // 24.0   FIG. 1 struck, crane to FIG. 2
  tunDraw: 24.6,
  flow: 10 * BAR,       // 26.667 airflow on
  pull: 31.6,
  cadence: 13 * BAR,    // 34.667
  end: 35.0,
};
// voice placement (line id → start, seconds)
export const VOICE = { l1: 0.5, l2: 5.6, l3: 11.827, l4: 22.3, l5: 27.3 };
// subtitles: t0/t1, screen y of the note's centre, leader direction
export const CUES = [
  { t0: 0.5, t1: 5.2, y: 1480, lead: -1, text: 'This bridge tore itself apart in a 40-mile-an-hour wind.' },
  { t0: 5.6, t1: 10.35, y: 1500, lead: -1, text: 'The Tacoma Narrows Bridge opened in July 1940.' },
  { t0: 11.83, t1: 16.3, y: 1735, lead: -1, text: 'Its deck was so thin and solid that steady wind made it twist,' },
  { t0: 16.4, t1: 20.95, y: 1735, lead: -1, text: 'harder and harder, until it ripped apart four months later.' },
  { t0: 22.3, t1: 26.7, y: 1735, lead: -1, text: 'Engineers learned that wind can shake a bridge to pieces.' },
  { t0: 27.3, t1: 31.9, y: 1265, lead: -1, text: "That's why modern bridges are tested in wind tunnels first." },
];
