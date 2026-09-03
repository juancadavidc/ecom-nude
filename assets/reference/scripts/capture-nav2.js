const { chromium } = require('playwright');
const path = require('path');
const OUT = '/Users/juandavidcadavid/Documents/Claude/Projects/NUDE SPORTWEAR/ecom/assets/reference';
const M = { viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, locale:'es-CO',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });

  // MOBILE slide-nav
  const ctx = await b.newContext(M);
  const p = await ctx.newPage();
  await p.goto('https://camilaperezsport.com', { waitUntil:'domcontentloaded', timeout:60000 });
  await p.waitForTimeout(5000);
  await p.locator('button.js-toggle-slide-nav:visible').last().click({ timeout:8000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(OUT,'mobile-03-nav-menu.png') });
  console.log('> saved mobile-03-nav-menu.png');
  try {
    await p.locator('.slide-nav a:visible, .slide-nav button:visible').filter({ hasText:/Colecciones/ }).first().click({ timeout:4000 });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(OUT,'mobile-03b-nav-submenu.png') });
    console.log('> saved mobile-03b-nav-submenu.png');
  } catch(e){ console.log('!! submenu:', e.message.split('\n')[0]); }
  await ctx.close();

  // DESKTOP quick view (patrón clave de ecom)
  const ctx2 = await b.newContext({ viewport:{width:1440,height:900}, locale:'es-CO' });
  const p2 = await ctx2.newPage();
  await p2.goto('https://camilaperezsport.com/collections/leggings', { waitUntil:'domcontentloaded', timeout:60000 });
  await p2.waitForTimeout(4500);
  try {
    await p2.locator('.quick-product__btn, .js-screen-open-product').first().click({ timeout:6000 });
    await p2.waitForTimeout(3000);
    await p2.screenshot({ path: path.join(OUT,'desktop-11-quickview.png') });
    console.log('> saved desktop-11-quickview.png');
  } catch(e){ console.log('!! quickview:', e.message.split('\n')[0]); }
  await ctx2.close();
  await b.close();
})().catch(e => console.error('FATAL', e.message.split('\n')[0]));
