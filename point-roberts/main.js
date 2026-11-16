// Page contract: window.READY, window.render(t), window.DUR, window.EV
const Q = new URLSearchParams(location.search);
const ctx = document.getElementById('c').getContext('2d');
await Promise.all(['500 40px "Bodoni Moda"', '600 40px "Bodoni Moda"', 'italic 500 40px "Bodoni Moda"', 'italic 600 40px "Bodoni Moda"', '400 40px "Pinyon Script"'].map(f => document.fonts.load(f)));
const [map, tl, lines] = await Promise.all(['data/map.json', 'timeline.json', 'lines.json'].map(u => fetch(u).then(r => r.json())));
const film = await import('./film.js');
film.setup(map, tl, lines);
window.DUR = film.DUR(); window.EV = film.events(); window.SRT = film.cues();
window.render = t => film.render(ctx, t, Q);
window.READY = true;
