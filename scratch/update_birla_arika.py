import os

html_path = '/Users/gj/.gemini/antigravity/scratch/Truth-Estate/public/tower-intel/birla-arika.html'

with open(html_path, 'r', encoding='utf-8') as f:
    code = f.read()

new_styles = '''
/* ══ TRUTH ESTATE BRANDED HEADER & UX ENHANCEMENTS ══ */
#topHeader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba(20, 17, 13, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(201, 169, 110, 0.25);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-family: 'Geist', system-ui, sans-serif;
}
.th-left { display: flex; align-items: center; gap: 14px; }
.th-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.th-logo { font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #f4efe6; letter-spacing: 0.05em; }
.th-pill { background: rgba(201, 169, 110, 0.15); border: 1px solid rgba(201, 169, 110, 0.4); color: #e7cf95; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
.th-title { display: flex; flex-direction: column; text-align: center; }
.th-proj { font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 600; color: #f4efe6; line-height: 1.1; }
.th-sub { font-size: 11px; color: #a9a196; }
.th-actions { display: flex; align-items: center; gap: 10px; }
.th-btn { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #f4efe6; font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; }
.th-btn:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(201, 169, 110, 0.5); color: #e7cf95; }
.th-btn.primary { background: #2f6b4f; border-color: #37805e; color: #f4efe6; font-weight: 600; }
.th-btn.primary:hover { background: #37805e; }

/* Feature Badges in Header & Title */
.badge-strip { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.f-badge { background: rgba(201, 169, 110, 0.1); border: 1px solid rgba(201, 169, 110, 0.3); color: #e7cf95; font-size: 10.5px; font-weight: 500; padding: 3px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; }

/* Feature Guide Modal */
#guideOverlay { position: fixed; inset: 0; background: rgba(10, 8, 6, 0.82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 250; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.35s ease; }
body.show-guide #guideOverlay { opacity: 1; pointer-events: auto; }
.guide-card { background: #14110d; border: 1px solid rgba(201, 169, 110, 0.35); border-radius: 16px; width: min(640px, 94vw); max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); position: relative; color: #f4efe6; font-family: 'Geist', system-ui, sans-serif; }
.guide-close { position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #a9a196; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; transition: all 0.2s; font-size: 14px; }
.guide-close:hover { color: #f4efe6; border-color: #c9a96e; background: rgba(201,169,110,0.15); }
.guide-header { text-align: center; margin-bottom: 24px; }
.guide-eyebrow { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25em; color: #c9a96e; }
.guide-title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; color: #f7f2e8; margin-top: 6px; line-height: 1.15; }
.guide-desc { font-size: 14px; color: #cbc2b4; margin-top: 8px; line-height: 1.5; max-width: 480px; margin-left: auto; margin-right: auto; }

.guide-grid { display: grid; gap: 14px; margin-bottom: 26px; }
.guide-step { background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; display: flex; gap: 14px; align-items: flex-start; }
.guide-step-num { width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; background: rgba(201, 169, 110, 0.12); border: 1px solid rgba(201, 169, 110, 0.35); color: #e7cf95; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 600; display: grid; place-items: center; }
.guide-step-body h4 { font-size: 15px; font-weight: 600; color: #f4efe6; margin-bottom: 4px; }
.guide-step-body p { font-size: 13px; color: #b8b0a3; line-height: 1.45; }

.guide-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.g-btn { background: #2f6b4f; border: 1px solid #37805e; color: #f4efe6; font-size: 13px; font-weight: 600; padding: 12px 22px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.g-btn:hover { background: #37805e; }
.g-btn.sec { background: rgba(201, 169, 110, 0.12); border-color: rgba(201, 169, 110, 0.4); color: #e7cf95; }
.g-btn.sec:hover { background: rgba(201, 169, 110, 0.22); border-color: rgba(201, 169, 110, 0.7); }

/* Floating Viewport Camera Toolbar */
#camBar { position: fixed; right: 18px; bottom: 80px; z-index: 45; display: flex; flex-direction: column; gap: 6px; background: rgba(20, 17, 13, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(201, 169, 110, 0.3); border-radius: 12px; padding: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); transition: opacity 0.3s; }
body.playing #camBar, body.flat-open #camBar { opacity: 0; pointer-events: none; }
.cam-btn { width: 38px; height: 38px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: #cbc2b4; font-size: 15px; cursor: pointer; display: grid; place-items: center; transition: all 0.18s; position: relative; }
.cam-btn:hover { background: rgba(201, 169, 110, 0.15); color: #f4efe6; border-color: rgba(201, 169, 110, 0.4); }
.cam-btn .cam-tip { position: absolute; right: calc(100% + 10px); top: 50%; transform: translateY(-50%) scale(0.9); transform-origin: right center; background: #14110d; border: 1px solid rgba(201, 169, 110, 0.3); color: #f4efe6; font-size: 11px; font-weight: 500; padding: 5px 9px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: all 0.15s; }
.cam-btn:hover .cam-tip { opacity: 1; transform: translateY(-50%) scale(1); }

/* Card Restyling for Dark Luxury Theme */
#title.card { top: 72px; left: 20px; background: rgba(20, 17, 13, 0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(201, 169, 110, 0.3); color: #f4efe6; border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); width: min(390px, 92vw); padding: 18px 20px; }
#title .eyebrow { color: #c9a96e; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; }
#title h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #f7f2e8; margin-top: 4px; }
#title p { font-size: 12.5px; color: #cbc2b4; line-height: 1.45; margin-top: 6px; }

#ovDock.card { background: rgba(20, 17, 13, 0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(201, 169, 110, 0.3); color: #f4efe6; border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
.ovd-hint { color: #cbc2b4; font-size: 12px; }
.ovd-hint b { color: #e7cf95; }
.ovd-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18); color: #f4efe6; border-radius: 8px; padding: 9px 14px; font-size: 12px; font-weight: 500; }
.ovd-btn:hover { background: rgba(201, 169, 110, 0.2); border-color: #c9a96e; color: #f4efe6; }
.ovd-btn.primary { background: #2f6b4f; border-color: #37805e; color: #f4efe6; }
.ovd-btn.primary:hover { background: #37805e; }

#panel.card { top: 72px; right: 20px; background: rgba(20, 17, 13, 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(201, 169, 110, 0.3); color: #f4efe6; border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
.phead { border-bottom: 1px solid rgba(255,255,255,0.08); }
.phead .e { color: #c9a96e; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; }
.phead h2 { color: #f7f2e8; font-size: 18px; }
.intro-lede { color: #cbc2b4; font-size: 13.5px; line-height: 1.5; }
.intro-lede b { color: #e7cf95; }
.pact { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #f4efe6; border-radius: 8px; padding: 11px 14px; font-size: 13px; font-weight: 500; width: 100%; text-align: left; cursor: pointer; transition: all 0.2s; }
.pact:hover { background: rgba(201, 169, 110, 0.15); border-color: rgba(201, 169, 110, 0.4); color: #e7cf95; }
.pact.primary { background: #2f6b4f; border-color: #37805e; color: #f4efe6; font-weight: 600; }
.pact.primary:hover { background: #37805e; }
.intro-foot { color: #a9a196; font-size: 11.5px; }

#sunctl.card { background: rgba(20, 17, 13, 0.92); backdrop-filter: blur(16px); border: 1px solid rgba(201, 169, 110, 0.3); color: #f4efe6; border-radius: 14px; }
#sunctl .eyebrow { color: #c9a96e; }
#sunctl .clock .t { color: #f6d68a; }
#sunctl .clock .ph { color: #c9a96e; }
#sunctl .sun-note { color: #a9a196; }
#sunToggle.card { background: rgba(20, 17, 13, 0.88); backdrop-filter: blur(12px); border: 1px solid rgba(201, 169, 110, 0.3); color: #e7cf95; }

#hint.card { top: 72px; left: 50%; transform: translateX(-50%); background: rgba(20, 17, 13, 0.82); backdrop-filter: blur(12px); border: 1px solid rgba(201, 169, 110, 0.25); color: #cbc2b4; font-size: 11.5px; padding: 7px 16px; border-radius: 20px; }
#hint b { color: #e7cf95; }

@media (max-width: 840px) {
  #topHeader { padding: 0 12px; }
  .th-title { display: none; }
  #title.card { top: 64px; left: 12px; width: calc(100vw - 24px); }
  #panel.card { top: auto; bottom: 80px; right: 12px; left: 12px; width: calc(100vw - 24px); max-height: 50vh; }
  #camBar { right: 12px; bottom: 140px; }
  #hint.card { display: none; }
}
'''

# 1. Insert new styles right before </style> in first style block
style_first_close = code.find('</style>')
if style_first_close != -1:
    code = code[:style_first_close] + new_styles + code[style_first_close:]

# 2. Insert new Header & Guide Overlay right after <div id="app"></div>
app_div = '<div id="app"></div>'
new_html = '''<div id="app"></div>

<!-- ══ TRUTH ESTATE BRANDED HEADER ══ -->
<header id="topHeader">
  <div class="th-left">
    <a href="/" class="th-brand" aria-label="Truth Estate Home">
      <span class="th-logo">TRUTH ESTATE</span>
      <span class="th-pill">3D SUN &amp; VASTU MODEL</span>
    </a>
  </div>
  <div class="th-title">
    <span class="th-proj">Birla Arika · Sector 31, Gurugram</span>
    <span class="th-sub">True-North Calibrated · 4 Towers · G+40</span>
  </div>
  <div class="th-actions">
    <button id="btnGuide" class="th-btn" title="How to use this 3D model">💡 Model Guide</button>
    <button id="btnConsult" class="th-btn primary" title="Talk to Independent Buyer Advisor">Talk to Buyer Office</button>
  </div>
</header>

<!-- ══ FEATURE GUIDE MODAL OVERLAY ══ -->
<div id="guideOverlay">
  <div class="guide-card">
    <button class="guide-close" id="guideClose" aria-label="Close guide">✕</button>
    <div class="guide-header">
      <div class="guide-eyebrow">Truth Estate Intelligence</div>
      <h2 class="guide-title">Sun &amp; Vastu 3D Model — Birla Arika</h2>
      <p class="guide-desc">The brochure shows one ideal sunset. We simulate every hour of every season — direct sunlight, afternoon heat, and true-north Vastu — unit by unit, floor by floor.</p>
    </div>
    
    <div class="guide-grid">
      <div class="guide-step">
        <div class="guide-step-num">1</div>
        <div class="guide-step-body">
          <h4>☀️ Solar Trajectory &amp; Shadows</h4>
          <p>Play live sun movement across Winter Solstice (21 Dec), Equinox (21 Mar), and Summer Solstice (21 Jun). Compute exact direct-sun hours per day for every floor plate (F1 to F40).</p>
        </div>
      </div>
      
      <div class="guide-step">
        <div class="guide-step-num">2</div>
        <div class="guide-step-body">
          <h4>🧭 True-North Vastu Compliance</h4>
          <p>Measured on true north, not guessed. Evaluate 8 principal zones (Pooja in NE, Master in SW, Kitchen in SE/Agni, Living in E/NE) for all 4 towers (T1, T2, T3, T7).</p>
        </div>
      </div>

      <div class="guide-step">
        <div class="guide-step-num">3</div>
        <div class="guide-step-body">
          <h4>🏢 Floor-by-Floor &amp; Unit 3D Dollhouse</h4>
          <p>Click any tower → tap a flat on its roof → open 3D unit dollhouse, 2D floor plate, airflow analysis, and 100-point livability scorecard.</p>
        </div>
      </div>
    </div>

    <div class="guide-actions">
      <button id="guideStartSun" class="g-btn">▶ Play Sun Simulation</button>
      <button id="guideRankTowers" class="g-btn sec">★ Rank Best Towers for Sun</button>
      <button id="guideExplore3D" class="g-btn sec">🔍 Explore 3D Model</button>
    </div>
  </div>
</div>

<!-- ══ FLOATING VIEWPORT CAMERA TOOLBAR ══ -->
<div id="camBar">
  <button class="cam-btn" id="camReset" title="Reset 3D View">
    <span>🎥</span>
    <span class="cam-tip">Default 3D View</span>
  </button>
  <button class="cam-btn" id="camTop" title="Top-Down Plan View">
    <span>📐</span>
    <span class="cam-tip">Top-Down Site Plan</span>
  </button>
  <button class="cam-btn" id="camSun" title="Face Sun Path">
    <span>☀️</span>
    <span class="cam-tip">Sun Arc View</span>
  </button>
  <button class="cam-btn" id="camNorth" title="Face True North">
    <span>🧭</span>
    <span class="cam-tip">True-North View</span>
  </button>
</div>
'''

code = code.replace(app_div, new_html, 1)

# 3. Replace #title card content
old_title = '''<div id="title" class="card">
  <div class="eyebrow">Birla Arika · Sector 31, Gurugram</div>
  <h1>Sun &amp; Unit Intelligence</h1>
  <p>4 towers · G+40 · 4 BHK 4300 (T1 / T2 / T3) &amp; 4 BHK 4900 (T7). Click a tower, then a flat on its roof.</p>
</div>'''

new_title = '''<div id="title" class="card">
  <div class="eyebrow">Birla Arika · Sector 31, Gurugram</div>
  <h1>Sun &amp; Unit Intelligence</h1>
  <p>Simulate sunlight, afternoon heat &amp; true-north Vastu for every flat before you buy.</p>
  <div class="badge-strip">
    <span class="f-badge">🏢 4 Towers (G+40)</span>
    <span class="f-badge">📐 4 BHK 4300 / 4900 sq ft</span>
    <span class="f-badge">❄️ Winter Solstice Benchmark</span>
    <span class="f-badge">🧭 True-North Calibrated</span>
  </div>
</div>'''

code = code.replace(old_title, new_title, 1)

# 4. Replace #hint card content
old_hint = '<div id="hint" class="card"><b>Drag</b> orbit · <b>Scroll</b> zoom · <b>Click</b> a tower → its roof → a flat</div>'
new_hint = '<div id="hint" class="card"><b>Drag</b> to orbit 3D · <b>Scroll</b> to zoom · <b>Click any tower roof</b> to inspect floor plate &amp; Vastu</div>'
code = code.replace(old_hint, new_hint, 1)

# 5. Add JS event handlers right before init() in script
init_pos = code.find('(function init(){setTime(0.5);renderOverview();})();')
js_handlers = '''
/* ── Header, Guide Overlay & Camera Toolbar Event Handlers ── */
(function setupHeaderAndGuide(){
  const guideOverlay = document.getElementById('guideOverlay');
  const btnGuide = document.getElementById('btnGuide');
  const guideClose = document.getElementById('guideClose');
  const btnConsult = document.getElementById('btnConsult');

  function showGuide(){ document.body.classList.add('show-guide'); }
  function hideGuide(){ document.body.classList.remove('show-guide'); }

  if(btnGuide) btnGuide.onclick = showGuide;
  if(guideClose) guideClose.onclick = hideGuide;
  if(btnConsult) btnConsult.onclick = ()=>{
    try {
      if(typeof window.parent !== 'undefined' && window.parent !== window){
        window.parent.postMessage({type:'te-consult', project:'Birla Arika', unit:'General Enquiry'}, '*');
      } else {
        alert('Thank you! Truth Estate Independent Buyer Office concierge is ready to assist you. Contact: +91 99999 99999');
      }
    } catch(_){}
  };

  const gSun = document.getElementById('guideStartSun');
  if(gSun) gSun.onclick = ()=>{ hideGuide(); enterPlay(); };
  const gRank = document.getElementById('guideRankTowers');
  if(gRank) gRank.onclick = ()=>{ hideGuide(); goRanking(); };
  const gExp = document.getElementById('guideExplore3D');
  if(gExp) gExp.onclick = ()=>{ hideGuide(); };

  // Camera toolbar buttons
  const cReset = document.getElementById('camReset');
  if(cReset) cReset.onclick = ()=>{ if(selTower) backToSite(); else flyTo(0,40,20,520,0.8,-0.9); };
  const cTop = document.getElementById('camTop');
  if(cTop) cTop.onclick = ()=>{ flyTo(0,40,20,580,0.05,0); };
  const cSun = document.getElementById('camSun');
  if(cSun) cSun.onclick = ()=>{
    const hx=lastSunDir.x, hz=lastSunDir.z;
    const want=Math.atan2(hz,hx)+Math.PI;
    flyTo(target.x, target.y, target.z, radius, 0.7, want);
  };
  const cNorth = document.getElementById('camNorth');
  if(cNorth) cNorth.onclick = ()=>{ flyTo(0,40,20,520,0.8,0); };
})();
'''

if init_pos != -1:
    code = code[:init_pos] + js_handlers + '\n' + code[init_pos:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(code)

print('Successfully updated birla-arika.html!')
