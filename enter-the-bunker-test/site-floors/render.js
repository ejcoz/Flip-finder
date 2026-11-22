// node render.js 3 7  → b3.png b7.png (1080x1080)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  // args: 3 7  or  h:name:querystring (e.g. h:hall_blank:blank=1)
  const jobs = process.argv.slice(2).map(a => { const [f, name, qs] = a.split(':'); return { f, name: name || 'b' + f, qs: qs || '' }; });
  const b = await chromium.launch();
  const errs = [];
  for (const j of jobs) {
    const q = new URLSearchParams(j.qs); const w = +(q.get('w') || 1080), h = +(q.get('h') || 1080);
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, 'floors.html') + '?f=' + j.f + (j.qs ? '&' + j.qs : ''));
    await p.waitForFunction('window.READY === true', null, { timeout: 60000 });
    await p.locator('canvas').screenshot({ path: path.join(__dirname, 'out', j.name + '.png') });
    console.log(j.name + '.png'); await p.close();
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
