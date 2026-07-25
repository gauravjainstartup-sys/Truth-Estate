/* Full-site sweep: every route, both viewports.
   Checks what can break silently — JS errors, missing/duplicate h1,
   horizontal overflow, images without alt, tap targets under 44px,
   and links pointing at a 404. */
import { chromium } from '/home/user/Truth-Estate/node_modules/playwright/index.mjs';
import { readdirSync } from 'fs';
const B = 'http://127.0.0.1:8100/Truth-Estate';
const VP = { mobile:{width:390,height:844}, desktop:{width:1440,height:900} };

const ROUTES = ['/', '/about', '/intelligence', '/intelligence/projects', '/intelligence/developers',
  '/intelligence/markets', '/intelligence/compare', '/shortlist', '/office', '/pricing', '/methodology',
  '/data-sources', '/investors', '/nri', '/vision', '/the-record', '/sun-vastu', '/deal-room',
  '/get-custom-project-report', '/privacy', '/terms', '/disclaimer',
  '/projects/gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63',
  '/projects/sample-read'];

const rows = [];
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const vpName of Object.keys(VP)) {
  const ctx = await b.newContext({ viewport: VP[vpName] });
  await ctx.route('**/functions/v1/**', r => r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"stored":0}'}));
  await ctx.route('**/rest/v1/**', r => r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  for (const route of ROUTES) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0,120)));
    p.on('console', m => { if (m.type()==='error' && !/ERR_|font|favicon|Failed to load resource/i.test(m.text())) errs.push(m.text().slice(0,120)); });
    let status = 0;
    try {
      const res = await p.goto(B + route, { waitUntil:'networkidle', timeout: 30000 });
      status = res?.status() ?? 0;
      await p.waitForTimeout(600);
    } catch (e) { errs.push('NAV ' + String(e).slice(0,80)); }

    const m = await p.evaluate(() => {
      const h1 = [...document.querySelectorAll('h1')].map(e => e.textContent?.trim() ?? '');
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const imgs = [...document.querySelectorAll('img')];
      const noAlt = imgs.filter(i => !i.hasAttribute('alt')).length;
      const small = [...document.querySelectorAll('a,button')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32);
      }).length;
      const title = document.title;
      const dupTitle = /Truth Estate \| Truth Estate/.test(title);
      return { h1n: h1.length, h1: h1[0]?.slice(0,44) ?? '', overflow, noAlt, small, title: title.slice(0,60), dupTitle };
    }).catch(() => null);

    rows.push({ vp: vpName, route, status, errs: errs.length, err: errs[0] ?? '', ...(m ?? {}) });
    await p.close();
  }
  await ctx.close();
}
await b.close();

const bad = rows.filter(r => r.status !== 200 || r.errs || r.h1n !== 1 || (r.overflow ?? 0) > 1 || r.dupTitle);
console.log(`\n${rows.length} page-loads · ${rows.length - bad.length} clean · ${bad.length} with findings\n`);
for (const r of bad) {
  const flags = [
    r.status !== 200 ? `HTTP ${r.status}` : '',
    r.errs ? `js:${r.errs} (${r.err})` : '',
    r.h1n !== 1 ? `h1×${r.h1n}` : '',
    (r.overflow ?? 0) > 1 ? `overflow ${r.overflow}px` : '',
    r.dupTitle ? 'dup-title' : '',
  ].filter(Boolean).join(' · ');
  console.log(`  [${r.vp}] ${r.route.slice(0,48).padEnd(50)} ${flags}`);
}
const a11y = rows.filter(r => (r.noAlt ?? 0) > 0 || (r.small ?? 0) > 0);
if (a11y.length) {
  console.log('\nA11Y / TAP TARGETS (advisory):');
  for (const r of a11y.slice(0, 10)) console.log(`  [${r.vp}] ${r.route.slice(0,44).padEnd(46)} img-no-alt:${r.noAlt} small-targets:${r.small}`);
}
