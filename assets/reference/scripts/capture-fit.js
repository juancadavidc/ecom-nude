const { chromium } = require('playwright');
const path = require('path');
const OUT = '/Users/juandavidcadavid/Documents/Claude/Projects/NUDE SPORTWEAR/ecom/assets/reference';
const B = 'https://camilaperezsport.com';
const UA_M = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// 1a pasada: viewport alto para forzar render de secciones lazy.
// 2a pasada: medir alto real del contenido y recortar el screenshot a esa altura.
async function fit(browser, { width, probe, url, file, mobile, dsf = 1 }) {
  const ctx = await browser.newContext({
    viewport: { width, height: probe }, deviceScaleFactor: dsf, locale: 'es-CO',
    isMobile: !!mobile, hasTouch: !!mobile, userAgent: mobile ? UA_M : undefined,
  });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(6000);
  try { await p.keyboard.press('Escape'); } catch (_) {}
  await p.evaluate(async () => { for (const y of [200,900,1800,0]) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,400)); } });
  await p.waitForTimeout(4000);
  // alto real = borde inferior del último elemento con contenido visible
  const h = await p.evaluate(() => {
    const foot = document.querySelector('footer, .site-footer, [class*="site-footer"]');
    if (foot) { const r = foot.getBoundingClientRect(); if (r.bottom > 100) return Math.ceil(r.bottom + 16); }
    return Math.ceil(document.body.scrollHeight);
  });
  await p.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width, height: Math.min(h, probe) } });
  console.log('> saved', file, `${width}x${Math.min(h, probe)} css`);
  await ctx.close();
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  await fit(b, { width: 390, probe: 9000, mobile: true, dsf: 2, url: B, file: 'mobile-02-home-full.png' });
  await fit(b, { width: 390, probe: 6000, mobile: true, dsf: 2, url: B + '/collections/leggings', file: 'mobile-05-collection-full.png' });
  await fit(b, { width: 390, probe: 8000, mobile: true, dsf: 2, url: B + '/products/legging-essential', file: 'mobile-07-pdp-full.png' });
  await fit(b, { width: 1440, probe: 5600, url: B, file: 'desktop-02-home-full.png' });
  await fit(b, { width: 1440, probe: 4200, url: B + '/collections/leggings', file: 'desktop-05-collection-full.png' });
  await fit(b, { width: 1440, probe: 4200, url: B + '/products/legging-essential', file: 'desktop-07-pdp-full.png' });
  await b.close();
})().catch(e => console.error('FATAL', e.message.split('\n')[0]));
