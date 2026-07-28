/* Every sign-in surface, real browser, mobile + desktop.
   Stops before submitting a code: no SMS spent, no account created. */
import { chromium } from '/home/user/Truth-Estate/node_modules/playwright/index.mjs';
const B = 'http://127.0.0.1:8100/Truth-Estate';
const REPORT = `${B}/projects/gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63`;
const VP = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const R = [];
const log = (s, vp, step, ok, d = '') => { R.push({ s, vp, step, ok, d }); console.log(`  ${ok ? 'ok  ' : 'FAIL'} [${vp}] ${s} · ${step}${d ? ' — ' + d : ''}`); };

async function mk(b, vp) {
  const ctx = await b.newContext({ viewport: VP[vp] });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push(String(e).slice(0, 140)));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION|font|favicon|404/i.test(m.text())) p.errs.push(m.text().slice(0, 140)); });
  return { ctx, p };
}
const vis = async (loc) => await loc.first().isVisible().catch(() => false);

/* Shared assertions for any phone+OTP form that is already on screen. */
async function checkPhoneForm(p, s, vp, { numSel, sendName, sel }) {
  const num = p.locator(numSel).first();
  if (!await vis(num)) { log(s, vp, 'phone field visible', false); return false; }
  log(s, vp, 'phone field visible', true);

  // is the field actually usable at this viewport (not clipped off-screen)?
  const box = await num.boundingBox();
  log(s, vp, 'field within viewport', !!box && box.x >= 0 && box.x + box.width <= VP[vp].width + 1,
      box ? `x=${Math.round(box.x)} w=${Math.round(box.width)}` : 'no box');

  if (sel) {
    const codes = await p.locator(sel).first().locator('option').allTextContents().catch(() => []);
    log(s, vp, 'international dial available', codes.some(c => !/\+91/.test(c)), codes.length + ' codes');
    await p.locator(sel).first().selectOption('+971').catch(() => {});
  }
  await num.fill('501234567');
  const btn = p.getByRole('button', { name: sendName }).first();
  if (!await vis(btn)) { log(s, vp, 'send button visible', false); return false; }
  await btn.click().catch(() => {});
  await p.waitForTimeout(2200);
  const blocked = await vis(p.getByText(/only verify Indian/i));
  log(s, vp, 'international not blocked', !blocked);
  /* Selector deliberately NOT maxlength="1" any more. The boxes carry
     maxLength={len} so the OS can hand over a whole code; keying a test on
     the old value made it match nothing and skip itself in silence. */
  const boxes = await p.locator('input[aria-label^="Digit"]').count();
  if (boxes) log(s, vp, 'OTP boxes = 4', boxes === 4, `got ${boxes}`);
  return true;
}

/* 1. Report unlock */
async function unlock(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'report unlock';
  try {
    await p.goto(REPORT, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const cta = p.getByRole('button', { name: /Get Full Read|Unlock the full read/i }).first();
    log(s, vp, 'unlock CTA present', await vis(cta));
    await cta.click().catch(() => {});
    await p.waitForTimeout(900);
    /* The sheet now opens on the NUMBER, not on a name: it looks the
       phone up first and only asks for a name if it does not know it.
       This asserted the old "quick sign-up" heading, so it failed the
       moment that became correct — and because the whole phone-form
       block sits behind it, eight further assertions stopped running
       silently. Assert what step one is now supposed to be. */
    const reg = await vis(p.getByText(/start with your mobile|quick sign-up|Create your account/i));
    log(s, vp, 'opens sign-up step', reg);
    const noName = (await p.locator('input[autocomplete="name"]:visible').count()) === 0;
    log(s, vp, 'step one asks for the number alone', noName);
    if (reg) {
      await checkPhoneForm(p, s, vp, { numSel: 'input[placeholder*="98xxxxxx"]', sendName: /Continue|Send code/i, sel: 'select[aria-label="Country code"]' });
    }
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}

/* 2. TruthGuide inline sign-in */
async function chat(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'truthguide chat';
  try {
    await p.goto(`${B}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    /* Two launchers by design: 'Challenge TruthGuide' (md:flex) and
       'Ask TruthGuide' (md:hidden). Match either, then take the visible one. */
    const open = p.locator('button[aria-label="Ask TruthGuide"]:visible, button[aria-label="Challenge TruthGuide"]:visible').first();
    log(s, vp, 'chat launcher present', await vis(open));
    await open.click().catch(() => {});
    await p.waitForTimeout(1200);
    const input = p.locator('input[placeholder*="Ask about"], textarea').first();
    log(s, vp, 'chat opens with an input', await vis(input));
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}

/* 3. Custom report request */
async function custom(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'custom report';
  try {
    await p.goto(`${B}/get-custom-project-report`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    await p.getByRole('button', { name: /^Gurugram$/ }).first().click().catch(() => {});
    await p.locator('input[type=text], input:not([type])').first().fill('DLF The Arbour').catch(() => {});
    await p.getByRole('button', { name: /Looking to invest/i }).first().click().catch(() => {});
    await p.getByRole('button', { name: /Continue/i }).first().click().catch(() => {});
    await p.waitForTimeout(900);
    const step2 = await vis(p.locator('input[type=tel], input[placeholder*="98"], input[inputmode=numeric]'));
    log(s, vp, 'reaches contact step', step2);
    if (step2) await checkPhoneForm(p, s, vp, { numSel: 'input[type=tel], input[inputmode=numeric]', sendName: /Send|code|Get/i, sel: 'select' });
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}

/* 4. Consultation booking */
async function consult(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'consultation';
  try {
    await p.goto(`${B}/sun-vastu`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const cta = p.getByRole('button', { name: /Request Independent Advice/i }).first();
    log(s, vp, 'advice CTA present', await vis(cta));
    await cta.click().catch(() => {});
    await p.waitForTimeout(1400);
    const num = p.locator('input[type=tel], input[inputmode=numeric], input[placeholder*="98"]').first();
    log(s, vp, 'register step renders', await vis(num));
    if (await vis(num)) {
      await p.locator('input[placeholder="Full name"]').first().fill('QA Tester').catch(()=>{});
      await checkPhoneForm(p, s, vp, { numSel: 'input[type=tel]', sendName: /Send|code/i, sel: 'select' });
      await checkOtpAutofill(p, s, vp);
    }
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}



/* The keyboard's code suggestion hands the WHOLE code to the focused box.
   Every box used to carry maxLength={1}, so the browser truncated it to one
   character before React saw it: one digit landed, three were dropped, and
   auto-submit never fired because the code was never complete. Filling the
   first box with the full code is exactly what the platform does. */
async function checkOtpAutofill(p, s, vp) {
  const boxes = p.locator('input[aria-label^="Digit"]:visible');
  const n = await boxes.count();
  if (!n) return;
  const ml = await boxes.first().getAttribute('maxlength');
  const ac = await boxes.first().getAttribute('autocomplete');
  log(s, vp, 'first box offers one-time-code', ac === 'one-time-code', `autocomplete=${ac}`);
  log(s, vp, 'boxes accept a whole code', ml !== '1', `maxlength=${ml}`);

  await boxes.first().fill('4827');
  await p.waitForTimeout(400);
  const vals = [];
  for (let i = 0; i < n; i++) vals.push(await boxes.nth(i).inputValue());
  log(s, vp, 'suggestion fills every box', vals.join('') === '4827', vals.join('|'));

  // and ordinary typing must still advance box to box
  for (let i = 0; i < n; i++) await boxes.nth(i).fill('');
  await boxes.nth(0).click();
  await p.keyboard.type('73');
  await p.waitForTimeout(300);
  const t = [];
  for (let i = 0; i < n; i++) t.push(await boxes.nth(i).inputValue());
  log(s, vp, 'typing still advances', t[0] === '7' && t[1] === '3', t.join('|'));
}

/* 5. Shortlist #1-match OTP sheet */
async function shortlist(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'shortlist otp';
  try {
    await p.goto(`${B}/shortlist`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const start = p.getByRole('button', { name: /Build my brief/i }).first();
    log(s, vp, 'entry CTA present', await vis(start));
    await start.click().catch(() => {});
    await p.waitForTimeout(1200);
    /* SCOPE THE WALK TO THE MODAL. Unscoped, `/Continue|Next|→|…/` matched
       "Build my brief →" — the page's own CTA, still visible BEHIND the
       open journey — so every iteration clicked the button underneath and
       the walk never left the first step. It looked exactly like a broken
       sign-in flow; the journey was open and working the whole time.

       Same trap as the comma-selector one in the README: a locator that is
       not scoped to the surface under test will happily find something
       plausible somewhere else on the page. */
    const D = '[role="dialog"] ';
    for (let i = 0; i < 16; i++) {
      const num = p.locator(`${D}input[type=tel]:visible, ${D}input[inputmode=numeric]:visible`).first();
      if (await vis(num)) break;
      const next = p.locator(`${D}button:visible`).filter({ hasText: /Continue|Next|See my|Show/i }).first();
      /* Only click if it will take the click. A disabled Continue means the
         step still wants an answer, and the chips below are how the walk
         supplies one — clicking it anyway just buys an actionability
         timeout, fourteen times over. */
      if (await vis(next) && await next.isEnabled().catch(() => false)) {
        await next.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(900); continue;
      }
      /* Stop the moment the brief is done — the processing screen has no
         question to answer, and blindly clicking its second button is how
         a walk ends up dismissing the modal it is supposed to be driving. */
      if (await vis(p.getByText(/Analysing your preferences/i))) break;
      const chip = p.locator(`${D}button:visible`).nth(1);
      if (await vis(chip)) { await chip.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(400); } else break;
    }
    /* The processing screen runs 4.2s and the AI re-rank behind it is a
       live call, so the sheet lands somewhere between 4 and 9 seconds.
       Poll rather than sleep a guessed constant — a fixed wait is how this
       assertion reported a broken sign-in on a flow that works. */
    const phone = () => p.locator('input[type=tel]:visible, input[inputmode=numeric]:visible').first();
    let reached = false;
    for (let i = 0; i < 24 && !reached; i++) {
      reached = await vis(phone());
      if (reached) break;
      const unlock = p.locator('button:visible').filter({ hasText: /Unlock with OTP|Unlock|Get the read|Reveal/i }).first();
      if (await vis(unlock)) await unlock.click({ timeout: 3000 }).catch(() => {});
      await p.waitForTimeout(600);
    }
    const num = phone();
    log(s, vp, 'reaches a phone step', reached);
    if (reached) await checkPhoneForm(p, s, vp, { numSel: 'input[type=tel]:visible, input[inputmode=numeric]:visible', sendName: /Send|code|Unlock|Verify/i, sel: 'select:visible' });
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}

/* 6. Buyer Office gate (3D / unit intelligence) */
async function gate(b, vp) {
  const { ctx, p } = await mk(b, vp); const s = 'buyer office gate';
  try {
    await p.goto(REPORT, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const cta = p.locator('button:visible').filter({ hasText: /Unlock your verdict|Sun & Vastu 3D|Explore the Sun/i }).first();
    log(s, vp, 'gate CTA present', await vis(cta));
    await cta.click().catch(() => {});
    await p.waitForTimeout(1500);
    const num = p.locator('input[type=tel]:visible, input[placeholder*="98"]:visible').first();
    const reached = await vis(num);
    log(s, vp, 'reaches a phone step', reached, reached ? '' : 'gate may open 3D directly');
    if (reached) {
      await p.locator('input[placeholder*="name" i]:visible').first().fill('QA Tester').catch(() => {});
      await checkPhoneForm(p, s, vp, { numSel: 'input[type=tel]:visible, input[placeholder*="98"]:visible', sendName: /Continue|Send code|Open my/i, sel: 'select:visible' });
    }
    log(s, vp, 'no js errors', p.errs.length === 0, p.errs[0] ?? '');
  } catch (e) { log(s, vp, 'THREW', false, String(e).slice(0, 120)); }
  await ctx.close();
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const vp of ['mobile', 'desktop']) {
  console.log(`\n──────── ${vp} ────────`);
  await unlock(b, vp); await chat(b, vp); await custom(b, vp); await consult(b, vp); await shortlist(b, vp); await gate(b, vp);
}
await b.close();
const f = R.filter(r => !r.ok);
console.log(`\n${R.length - f.length} passed, ${f.length} failed`);
if (f.length) { console.log('\nFAILURES:'); f.forEach(r => console.log(`  [${r.vp}] ${r.s} · ${r.step} ${r.d}`)); }
