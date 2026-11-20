// node cover.cjs <filmDir> <outDir> t1 t2 ...  → <outDir>/<film>_<t>.png, scene only (window.COVER)
const { chromium } = require('playwright');
const [dir, outDir, ...ts] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.addInitScript(() => { window.COVER = true; });
  await p.goto('file://' + dir + '/index.html'); await p.waitForFunction('window.READY', null, { timeout: 60000 });
  const name = dir.split('/').pop();
  for (const t of ts) { await p.evaluate(t => window.render(+t), t); await p.waitForTimeout(100);
    await (await p.$('canvas')).screenshot({ path: `${outDir}/${name}_${t}.png` }); }
  await b.close();
})();
