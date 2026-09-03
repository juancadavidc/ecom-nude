const { chromium } = require('playwright');
const path = require('path');

const OUT = '/Users/juandavidcadavid/Documents/Claude/Projects/NUDE SPORTWEAR/ecom/assets/reference';
const BASE = 'https://camilaperezsport.com';
const PDP = '/products/legging-essential';
const COL = '/collections/leggings';

const log = (...a) => console.log('>', ...a);

async function settle(page, ms = 3000) {
  await page.waitForTimeout(ms);
  // Dismiss newsletter popups / cookie banners
  const closers = [
    'button[aria-label*="close" i]', 'button[aria-label*="cerrar" i]',
    '.needsclick button[aria-label*="Close" i]', '[id*="popup"] button.close',
    'button:has-text("Aceptar")', 'button:has-text("Acepto")',
    '.klaviyo-close-form', '#shopify-pc__banner__btn-accept',
  ];
  for (const sel of closers) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 })) { await el.click({ timeout: 1000 }); await page.waitForTimeout(500); }
    } catch (_) {}
  }
  try { await page.keyboard.press('Escape'); } catch (_) {}
}

// Scroll the whole page so lazy-loaded images render, then return to top
async function lazyLoad(page) {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, ...opts });
  log('saved', name);
}

async function tryClick(page, selectors, label) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 2500 });
        log('clicked', label, 'via', sel);
        return true;
      }
    } catch (_) {}
  }
  log('!! could not click', label);
  return false;
}

async function run(kind, ctxOpts, prefix) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({
    ...ctxOpts,
    locale: 'es-CO',
    userAgent: ctxOpts.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await ctx.newPage();

  // --- HOME ---
  log(`[${kind}] home`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 4000);
  await shot(page, `${prefix}-01-home-fold.png`);
  await lazyLoad(page);
  await shot(page, `${prefix}-02-home-full.png`, { fullPage: true });

  // --- NAV ---
  if (kind === 'mobile') {
    await tryClick(page, [
      'button[aria-label*="menu" i]', 'summary[aria-label*="menu" i]',
      '.header__icon--menu', '#menu-icon', '.mobile-nav-toggle',
      'header button:has(svg)',
    ], 'mobile menu');
    await page.waitForTimeout(1500);
    await shot(page, `${prefix}-03-nav-menu.png`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  } else {
    // hover main nav to expose dropdown/megamenu
    const candidates = ['TIENDA', 'Tienda', 'COLECCIONES', 'Colecciones', 'ROPA', 'LEGGINGS'];
    let ok = false;
    for (const t of candidates) {
      try {
        const el = page.locator(`header a:has-text("${t}"), header summary:has-text("${t}"), nav a:has-text("${t}")`).first();
        if (await el.isVisible({ timeout: 600 })) {
          await el.hover({ timeout: 2000 });
          await page.waitForTimeout(1200);
          ok = true; log('hovered nav', t); break;
        }
      } catch (_) {}
    }
    if (!ok) log('!! no nav item hovered');
    await shot(page, `${prefix}-03-nav-megamenu.png`);
    await page.mouse.move(0, 600);
    await page.waitForTimeout(500);
  }

  // --- COLLECTION ---
  log(`[${kind}] collection`);
  await page.goto(BASE + COL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 4000);
  await shot(page, `${prefix}-04-collection-fold.png`);
  await lazyLoad(page);
  await shot(page, `${prefix}-05-collection-full.png`, { fullPage: true });

  // --- PDP ---
  log(`[${kind}] pdp`);
  await page.goto(BASE + PDP, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 4000);
  await shot(page, `${prefix}-06-pdp-fold.png`);
  await lazyLoad(page);
  await shot(page, `${prefix}-07-pdp-full.png`, { fullPage: true });

  // --- CART ---
  log(`[${kind}] cart`);
  // pick a size/variant first if required
  await tryClick(page, [
    'label:has-text("M")', 'input[type="radio"][value="M"] + label',
    '.product-form__input label >> nth=1',
  ], 'variant M');
  await page.waitForTimeout(800);
  const added = await tryClick(page, [
    'button[name="add"]', '.product-form__submit', 'button:has-text("Agregar")',
    'button:has-text("Añadir")', 'button:has-text("AGREGAR AL CARRITO")',
  ], 'add to cart');
  if (added) {
    await page.waitForTimeout(3500);
    await shot(page, `${prefix}-08-cart-drawer.png`);
  }
  await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 3000);
  await shot(page, `${prefix}-09-cart-page.png`, { fullPage: true });

  await browser.close();
  log(`[${kind}] DONE`);
}

(async () => {
  await run('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, 'desktop');
  await run('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'mobile');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
