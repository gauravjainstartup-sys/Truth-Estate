/* End-to-end user journeys, both viewports, against the built export.
   Supabase calls are stubbed so a backend blip cannot masquerade as a UI
   defect — the point here is whether the FLOWS complete. */
import { chromium } from '/home/user/Truth-Estate/node_modules/playwright/index.mjs';
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const B='http://127.0.0.1:8100/Truth-Estate';
const REPORT=`${B}/projects/gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63`;
const VP={mobile:{width:390,height:844},desktop:{width:1440,height:900}};
const R=[]; const log=(f,vp,step,ok,d='')=>{R.push({ok});console.log(`  ${ok?'ok  ':'FAIL'} [${vp}] ${f} · ${step}${d?' — '+d:''}`)};

async function mk(b,vp,signedIn=false){
  const ctx=await b.newContext({viewport:VP[vp]});
  if(signedIn) await ctx.addInitScript(`(()=>{localStorage.setItem('truthEstate.signedIn','1');localStorage.setItem('truthEstate.tgAnon','d72b361a-3450-486b-94f0-8ee275556747');localStorage.setItem('truthEstate.account',JSON.stringify({name:'Gaurav Jain',createdAt:Date.now(),buy:{possession:null,purchaseType:null,budgetCr:6,locations:[],configs:[],timeline:null,priorities:[]},booking:null}))})()`);
  /* Playwright matches routes LAST-registered-first, so the catch-all has
     to be registered before the specific ones or it shadows them. */
  await ctx.route('**/functions/v1/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"stored":0}'}));
  await ctx.route('**/functions/v1/entitlements',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"userId":"u","unlocked":[],"all":false,"plan":"Free"}'}));
  await ctx.route('**/functions/v1/brief',r=>r.fulfill({status:200,contentType:'application/json',body:require('fs').readFileSync('/tmp/fixture-brief.json','utf8')}));
  const p=await ctx.newPage(); p.errs=[];
  p.on('pageerror',e=>p.errs.push(String(e).slice(0,120)));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_|font|favicon|Failed to load resource/i.test(m.text()))p.errs.push(m.text().slice(0,120))});
  return {ctx,p};
}
const vis=l=>l.first().isVisible().catch(()=>false);

/* 1 · unlock → package → pay → report unmasked */
async function unlockToPaid(b,vp){
  const {ctx,p}=await mk(b,vp,true); const F='unlock→pay';
  try{
    await p.goto(REPORT,{waitUntil:'networkidle'}); await p.waitForTimeout(900);
    log(F,vp,'report locked initially', await vis(p.locator('#unlock')));
    /* No ?as=owner — the buyer framing is the default and the money path.
       The owner reframe must never leak into it. */
    log(F,vp,'buyer framing on a plain visit', await vis(p.getByText(/on a brochure/i)));
    await p.locator('button:visible').filter({hasText:/Get Full Read|Unlock the full read/i}).first().click().catch(()=>{});
    await p.waitForTimeout(900);
    /* Scope to the modal: "Unlock full read" also exists in the page nav,
       and .first() was picking the hidden one. */
    const plans=await vis(p.locator('text=Choose your access').or(p.locator('text=One-time, no subscription')));
    log(F,vp,'plan ladder shows', plans);
    await p.locator('button:visible').filter({hasText:/Get the read —|Get read \+ 3D|Go All-Access/i}).first().click().catch(()=>{});
    await p.waitForTimeout(800);
    const pay=await vis(p.getByText(/Razorpay/i));
    log(F,vp,'checkout appears', pay);
    await p.locator('button:visible').filter({hasText:/^Pay ₹/i}).first().click().catch(()=>{});
    /* The success screen shows for ~1.4s then the modal closes itself, so
       a fixed wait lands after it is gone. Poll instead. */
    let done=false;
    for (let i=0;i<26 && !done;i++){ done=await vis(p.getByText(/You.re unlocked|Opening your full read/i)); if(!done) await p.waitForTimeout(120); }
    log(F,vp,'payment completes', done);
    await p.waitForTimeout(2200);
    const pillars=await vis(p.locator('#developer, #location, #legal'));
    log(F,vp,'paid pillars render after unlock', pillars);
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

/* 2 · chat: open, ask, receive */
async function chatAsk(b,vp){
  const {ctx,p}=await mk(b,vp); const F='chat';
  try{
    await p.goto(`${B}/`,{waitUntil:'networkidle'}); await p.waitForTimeout(1100);
    await p.locator('button[aria-label="Ask TruthGuide"]:visible, button[aria-label="Challenge TruthGuide"]:visible').first().click().catch(()=>{});
    await p.waitForTimeout(1200);
    const input=p.locator('input[placeholder*="Ask about"]:visible, textarea:visible').first();
    log(F,vp,'opens', await vis(input));
    if(await vis(input)){
      await input.fill('Which projects are on Dwarka Expressway?');
      await p.keyboard.press('Enter'); await p.waitForTimeout(2000);
      const bubbles=await p.locator('[class*="whitespace-pre-wrap"], [class*="rounded"]').count();
      log(F,vp,'accepts a question', bubbles>0, `${bubbles} nodes`);
    }
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

/* 3 · dashboard both states */
async function dashboard(b,vp){
  const {ctx,p}=await mk(b,vp,true); const F='dashboard';
  try{
    await p.goto(`${B}/office`,{waitUntil:'networkidle'}); await p.waitForTimeout(3200);
    log(F,vp,'verdict renders', await vis(p.getByText(/Our read on your search/i)));
    log(F,vp,'fit table renders', await vis(p.getByText(/Against your brief/i)));
    log(F,vp,'fit ≠ truth score shown', await vis(p.getByText(/Fit is about you/i)));
    log(F,vp,'founder call present', await vis(p.getByText(/Talk it through with the founder/i)));
    log(F,vp,'demo switcher hidden', !(await vis(p.locator('text=PREVIEW'))));
    /* On mobile the nav is collapsed behind a Menu toggle by design. */
    if (vp==='mobile') await p.locator('button:visible').filter({hasText:/^Menu$/}).first().click().catch(()=>{});
    await p.waitForTimeout(400);
    const nav=await p.locator('aside a:visible').count();
    log(F,vp,'sidebar nav reachable', nav>=5, `${nav} links`);
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

/* 4 · legacy URL still lands on the report */
async function legacyUrl(b,vp){
  const {ctx,p}=await mk(b,vp); const F='legacy url';
  try{
    await p.goto(`${B}/intelligence/projects/dlf-the-arbour`,{waitUntil:'networkidle'});
    await p.waitForTimeout(1500);
    const url=p.url();
    log(F,vp,'redirects to the new address', /\/projects\/gurugram-real-estate-dlf-the-arbour/.test(url), url.slice(-52));
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

/* 5 · owner path — "I've already booked or bought" */
const DIALOG='[role="dialog"] ';
async function toOwnerSearch(p){
  await p.goto(`${B}/`,{waitUntil:'networkidle'}); await p.waitForTimeout(900);
  await p.locator('button:visible').filter({hasText:/Start Your Journey/i}).first().click();
  await p.waitForTimeout(900);
  const doors = await vis(p.getByText(/I.m looking to buy/i)) && await vis(p.getByText(/already booked or bought/i));
  await p.getByText(/already booked or bought/i).first().click();
  await p.locator(`${DIALOG}button:visible`).filter({hasText:/^Continue$/}).first().click();
  await p.waitForTimeout(800);
  return doors;
}

/* found → the report they own, locked */
async function ownerFound(b,vp){
  const {ctx,p}=await mk(b,vp); const F='owner · found';
  try{
    log(F,vp,'both doors on screen one', await toOwnerSearch(p));
    const input=p.locator('input[aria-label="Project name"]:visible').first();
    log(F,vp,'one question, no date/price/size', await vis(input));
    await input.fill('dlf arb'); await p.waitForTimeout(800);
    const covered=p.locator(`${DIALOG}button:visible`).filter({hasText:/DLF The Arbour/i}).first();
    log(F,vp,'fuzzy match finds the covered project', await vis(covered));
    await covered.click(); await p.waitForTimeout(2000);
    log(F,vp,'lands on their report', /\/projects\/gurugram-real-estate-dlf-the-arbour/.test(p.url()), p.url().slice(-44));
    log(F,vp,'report is locked', await vis(p.locator('#unlock')));
    log(F,vp,'marked as an owner read', /\?as=owner/.test(p.url()));
    log(F,vp,'paywall speaks to an owner', await vis(p.getByText(/This is what you bought/i)));
    log(F,vp,'buyer framing withdrawn', !(await vis(p.getByText(/on a brochure/i))));
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

/* not found → Places confirms (or does not) → the ₹999 audit request.
   Both outcomes must reach the request. Places is a confidence signal,
   never a gate — an owner whose tower Google has never heard of is still
   an owner. */
async function ownerUnlisted(b,vp,mode){
  const {ctx,p}=await mk(b,vp); const F=`owner · ${mode}`;
  const body = mode==='confirmed'
    ? JSON.stringify({suggestions:[{placePrediction:{placeId:'pid-1',structuredFormat:{
        mainText:{text:'Zenith Skyline Towers'},
        secondaryText:{text:'Sector 106, Dwarka Expressway, Gurugram'}}}}]})
    : JSON.stringify({suggestions:[]});
  await ctx.route('https://places.googleapis.com/**',r=>r.fulfill({status:200,contentType:'application/json',body}));
  try{
    await toOwnerSearch(p);
    const input=p.locator('input[aria-label="Project name"]:visible').first();
    await input.fill('Zenith Skyline Towers'); await p.waitForTimeout(1600);
    log(F,vp,'admits we do not cover it', await vis(p.getByText(/don.t cover/i)));
    const cta = mode==='confirmed'
      ? p.locator(`${DIALOG}button:visible`).filter({hasText:/Sector 106/i}).first()
      : p.locator(`${DIALOG}button:visible`).filter({hasText:/Send it to us anyway/i}).first();
    log(F,vp,mode==='confirmed'?'Places offers the match':'still offers a way through', await vis(cta));
    await cta.click(); await p.waitForTimeout(2000);
    const u=p.url();
    log(F,vp,'reaches the audit request', /get-custom-project-report/.test(u));
    log(F,vp,'persona carried over, not re-asked', /intent=invested/.test(u));
    log(F,vp,`recorded as ${mode}`, new RegExp(`place=${mode}`).test(u));
    /* The URL saying intent=invested proves nothing on its own — the page
       has to have READ it. Continue is enabled only when project, city and
       intent are all set, so an enabled button is proof all three landed.
       Unverified has no address, so no city, so the visitor still has to
       pick one: disabled there is the correct answer, not a failure. */
    const nameOk=await p.locator('input[value="Zenith Skyline Towers"]').count()>0;
    log(F,vp,'project name prefilled', nameOk);
    const cont=p.locator('button:visible').filter({hasText:/Continue →/}).first();
    const enabled=await cont.isEnabled().catch(()=>false);
    log(F,vp, mode==='confirmed'?'prefill completes step 1':'city still asked (no address to infer it)',
        mode==='confirmed'?enabled:!enabled);
    log(F,vp,'no js errors', p.errs.length===0, p.errs[0]??'');
  }catch(e){log(F,vp,'THREW',false,String(e).slice(0,110))}
  await ctx.close();
}

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for(const vp of ['mobile','desktop']){
  console.log(`\n──── ${vp} ────`);
  await unlockToPaid(b,vp); await chatAsk(b,vp); await dashboard(b,vp); await legacyUrl(b,vp);
  await ownerFound(b,vp); await ownerUnlisted(b,vp,'confirmed'); await ownerUnlisted(b,vp,'unverified');
}
await b.close();
const f=R.filter(r=>!r.ok).length;
console.log(`\n${R.length-f} passed, ${f} failed`);
