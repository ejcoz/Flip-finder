// node render.js 3 7  → b3.png b7.png (1080x1080)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const floors = process.argv.slice(2).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  for (const f of floors) {
    await p.goto('file://' + path.join(__dirname, 'floors.html') + '?f=' + f);
    await p.waitForFunction('window.READY === true', null, { timeout: 60000 });
    await p.locator('canvas').screenshot({ path: path.join(__dirname, 'out', `b${f}.png`) });
    console.log('b' + f + '.png');
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
