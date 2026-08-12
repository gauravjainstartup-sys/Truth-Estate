"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — LANDING (the founder-frozen creative)

   A committed dark "private negotiation room" world. Faithful port of the
   approved prototype: animated hero (mandate → the market competes → best
   offer, in writing), trust band, the Audit→Close stepper, verbal-vs-on-record,
   savings calculator, offers table, follow-the-money, FAQ and close.

   The page's own CSS lives in ./dealRoomLandingCss (scoped under `.te-dr` so it
   can't leak into the rest of the site). Every "Enter the Deal Room" CTA calls
   onEnter(), which opens the real mandate capture in-page — the story continues.
   Figures are illustrative and clearly labelled; nothing here is a past deal.
   ════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { DEAL_ROOM_CSS } from "./dealRoomLandingCss";

const TABS = ["Audit", "Recommend", "Strategise", "Compete", "Close"];

const trimNum = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
const inr = (lakhs: number) => (lakhs >= 100 ? "₹" + trimNum(lakhs / 100) + " Cr" : "₹" + Math.round(lakhs) + " L");
const rangeStr = (lo: number, hi: number) => {
  if (hi < 100) return "₹" + Math.round(lo) + "–" + Math.round(hi) + " L";
  if (lo >= 100) return "₹" + trimNum(lo / 100) + "–" + trimNum(hi / 100) + " Cr";
  return inr(lo) + " – " + inr(hi);
};

export default function DealRoomLanding({ onEnter }: { onEnter: () => void }) {
  const [tab, setTab] = useState(0);
  const [budget, setBudget] = useState(240); // lakhs

  return (
    <div className="te-dr">
      <style dangerouslySetInnerHTML={{ __html: DEAL_ROOM_CSS }} />

      {/* nav */}
      <nav>
        <div className="nav-in">
          <div className="word">Truth<b>Estate</b></div>
          <div className="nav-r">
            <a className="lk" href="#work">How it works</a>
            <a className="lk" href="#savings">Savings</a>
            <button className="btn btn-ghost" onClick={onEnter}>Enter the Deal Room</button>
          </div>
        </div>
      </nav>

      {/* hero */}
      <header>
        <div className="wrap">
          <div className="hero">
            <div>
              <p className="eyebrow">The Deal Room · buyer-side, on record</p>
              <h1>You no longer<br />negotiate alone.</h1>
              <p className="sub">{"One independent party on your side of the table — flat-fee, never developer-paid. We audit what you're buying, make the market compete, and bring every offer back "}<em>in writing</em>.</p>
              <div className="hero-cta">
                <button className="btn btn-go" onClick={onEnter}>Enter the Deal Room →</button>
                <span className="chip-rec">Every offer on record, not verbal</span>
              </div>
            </div>
            <div>
              <svg className="scene" viewBox="0 0 480 420" role="img" aria-label="You post one mandate; four sellers and brokers compete; the best offer, 12% under your ceiling, comes back in writing.">
                <g className="pop g1">
                  <rect x="140" y="10" width="200" height="62" rx="10" className="node node-str" />
                  <text x="240" y="30" textAnchor="middle" className="lbl">YOUR MANDATE</text>
                  <text x="240" y="49" textAnchor="middle" className="price" style={{ fill: "var(--gold-lite)" }}>3 BHK · Sector 63A</text>
                  <text x="240" y="64" textAnchor="middle" className="who">CEILING ₹2.40 CR</text>
                </g>
                <path className="flow draw g2" d="M240,72 C240,110 70,110 70,150" />
                <path className="flow draw g2" d="M240,72 C240,110 183,110 183,150" />
                <path className="flow draw g2" d="M240,72 C240,110 297,110 297,150" />
                <path className="flow draw g2" d="M240,72 C240,110 410,110 410,150" />
                <g className="pop o1"><rect x="24" y="150" width="92" height="58" rx="9" className="node node-str" /><text x="70" y="171" textAnchor="middle" className="who">PRIMARY</text><text x="70" y="192" textAnchor="middle" className="price">₹2.42 Cr</text></g>
                <g className="pop o2"><rect x="137" y="150" width="92" height="58" rx="9" className="node node-str" /><text x="183" y="171" textAnchor="middle" className="who">BROKER · A</text><text x="183" y="192" textAnchor="middle" className="price">₹2.31 Cr</text></g>
                <g className="pop o3"><rect x="251" y="150" width="92" height="58" rx="9" className="node node-str" /><text x="297" y="171" textAnchor="middle" className="who">RESALE</text><text x="297" y="192" textAnchor="middle" className="price">₹2.20 Cr</text></g>
                <g className="pop o4"><rect x="364" y="150" width="92" height="58" rx="9" className="node node-str" style={{ stroke: "rgba(47,107,79,.5)" }} /><text x="410" y="171" textAnchor="middle" className="who">SELLER · D</text><text x="410" y="192" textAnchor="middle" className="price" style={{ fill: "var(--green-soft)" }}>₹2.11 Cr</text></g>
                <path className="flow-2 draw g3" d="M70,208 C70,250 240,250 240,286" />
                <path className="flow-2 draw g3" d="M183,208 C183,250 240,250 240,286" />
                <path className="flow-2 draw g3" d="M297,208 C297,250 240,250 240,286" />
                <path className="flow-2 draw g3" d="M410,208 C410,250 240,250 240,286" />
                <g className="best bcard">
                  <rect x="118" y="286" width="244" height="94" rx="12" fill="rgba(47,107,79,.16)" stroke="var(--green)" strokeWidth="1.5" />
                  <text x="240" y="309" textAnchor="middle" className="lbl" style={{ fill: "var(--green-soft)" }}>BEST OFFER · IN WRITING</text>
                  <text x="240" y="343" textAnchor="middle" style={{ fill: "var(--ink)", fontFamily: "var(--serif)", fontSize: "30px", fontWeight: 600 }}>₹2.11 Cr</text>
                  <text x="240" y="366" textAnchor="middle" style={{ fill: "var(--green-soft)", fontSize: "12px", fontWeight: 700, letterSpacing: ".04em" }}>−12% vs your ceiling · you decide</text>
                </g>
              </svg>
              <p className="scene-cap">Illustration of how the room works — a sample mandate, not a past deal.</p>
            </div>
          </div>
        </div>
      </header>

      {/* trust band */}
      <section className="band">
        <div className="wrap" style={{ padding: "40px 24px" }}>
          <div className="tb">
            <div className="cell"><div className="big">10–15%</div><div className="cap">better than negotiating alone, typically — a capability, not a promise</div></div>
            <div className="cell"><div className="big">Flat fee</div><div className="cap">agreed up front — never a percentage of your deal</div></div>
            <div className="cell"><div className="big grn">₹0</div><div className="cap">taken from developers — no brokerage, no promotion money, ever</div></div>
            <div className="cell"><div className="big">On record</div><div className="cap">every offer in writing, with a full cost break-up — not a verbal promise</div></div>
          </div>
        </div>
      </section>

      {/* stitched workflow */}
      <section id="work">
        <div className="wrap sec">
          <div>
            <p className="eyebrow">One represented journey</p>
            <h2>{"We don't just negotiate. We make sure you buy the right thing, at the right price — on record."}</h2>
            <p className="lede">{"Every stage runs on Truth Estate's own forensic intelligence — the evidence base that already covers every tracked Gurugram project — stitched into a single mandate. Click through what actually happens."}</p>
          </div>

          <div className="flowwrap">
            <div className="tabs" role="tablist" aria-label="How the Deal Room works">
              {TABS.map((t, i) => (
                <button key={t} className="tab" role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
                  <div className="tn">{"0" + (i + 1)}</div><div className="tt">{t}</div>
                </button>
              ))}
            </div>

            <div className={`panel ${tab === 0 ? "on" : ""}`} role="tabpanel">
              <div>
                <h3>First, is it even the right buy?</h3>
                <p className="pdesc">{"We run Truth Estate's forensic audit on your target — the filed rate versus the asking price, the true all-in cost, delivery-risk flags, and every place the report's own numbers disagree with the sales pitch. You start from evidence, not a brochure."}</p>
              </div>
              <div className="out">
                <p className="otag">Audit · Sector 63A · 3 BHK</p>
                <div className="orow"><span className="ok">Asking price</span><span className="ov">₹2.40 Cr</span></div>
                <div className="orow"><span className="ok">Filed rate implies</span><span className="ov r">₹2.18 Cr</span></div>
                <div className="orow"><span className="ok">True all-in (with charges)</span><span className="ov">₹2.63 Cr</span></div>
                <div className="orow"><span className="ok">Red flags found</span><span className="ov r">3</span></div>
              </div>
            </div>

            <div className={`panel ${tab === 1 ? "on" : ""}`} role="tabpanel">
              <div>
                <h3>{"Maybe there's a better buy nearby."}</h3>
                <p className="pdesc">{"Before you commit, we put your mandate against every tracked alternative in the corridor and surface units that beat yours on price, delivery or upside. You pick your target with eyes open — sometimes it's the one you came for, sometimes it isn't."}</p>
              </div>
              <div className="out">
                <p className="otag">Better-value alternatives</p>
                <div className="altchips">
                  <span className="altchip">Tower C · higher floor · <b>92% fit</b></span>
                  <span className="altchip">Resale, 63A · <b>−₹14L</b></span>
                  <span className="altchip">Adjacent project · <b>+2yr sooner</b></span>
                </div>
                <div className="orow" style={{ marginTop: "16px" }}><span className="ok">Shortlisted for your mandate</span><span className="ov g">3 of 21</span></div>
              </div>
            </div>

            <div className={`panel ${tab === 2 ? "on" : ""}`} role="tabpanel">
              <div>
                <h3>Walk in with a plan, not a hope.</h3>
                <p className="pdesc">We build your negotiation strategy on the numbers: your real leverage, a defensible target and a walk-away, and the timing that actually moves a seller. You know your floor and ceiling before anyone quotes you anything.</p>
              </div>
              <div className="out">
                <p className="otag">Your negotiation plan</p>
                <div className="orow"><span className="ok">Target price</span><span className="ov g">₹2.12 Cr</span></div>
                <div className="orow"><span className="ok">Walk-away</span><span className="ov">₹2.28 Cr</span></div>
                <div className="orow"><span className="ok">Leverage points</span><span className="ov">Inventory age · quarter-end · 2 rivals</span></div>
              </div>
            </div>

            <div className={`panel ${tab === 3 ? "on" : ""}`} role="tabpanel">
              <div>
                <h3>Let the market bid for you.</h3>
                <p className="pdesc">Your mandate goes out to primary and resale at once, as a serious represented buyer. Sellers compete — and every offer returns in writing, with a full cost break-up, so the cheapest sticker never fools you into the wrong deal.</p>
              </div>
              <div className="out">
                <p className="otag">The market responds</p>
                <div className="orow"><span className="ok">Offers received</span><span className="ov">4</span></div>
                <div className="orow"><span className="ok">Best, in writing</span><span className="ov g">₹2.11 Cr</span></div>
                <div className="bar" style={{ marginTop: "14px" }}><i style={{ left: 0, width: "88%" }} /></div>
                <div className="barcap"><span>−12% vs your ceiling</span><span>₹2.40 Cr</span></div>
              </div>
            </div>

            <div className={`panel ${tab === 4 ? "on" : ""}`} role="tabpanel">
              <div>
                <h3>On record, all the way to signing.</h3>
                <p className="pdesc">{"We hold your side through to written confirmation of the final terms — represented by you, accountable to you, the whole way. You leave with a documented deal, not a handshake you can't hold anyone to."}</p>
              </div>
              <div className="out">
                <p className="otag">Final terms · in writing</p>
                <div className="orow"><span className="ok">Agreed price</span><span className="ov g">₹2.11 Cr</span></div>
                <div className="orow"><span className="ok">All-in, documented</span><span className="ov">₹2.26 Cr</span></div>
                <div className="orow"><span className="ok">Your saving vs asking</span><span className="ov g">≈ ₹29 L</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* on record */}
      <section className="band">
        <div className="wrap sec">
          <div>
            <p className="eyebrow">On record</p>
            <h2>{"Not “the builder said”. A written number you can hold them to."}</h2>
            <p className="lede">{"In this market, the best “deal” is usually a verbal promise that quietly evaporates at signing. In the Deal Room, every offer is a documented number with a full cost break-up — comparable, accountable, and yours to keep."}</p>
          </div>
          <div className="rec2">
            <div className="rc verbal">
              <p className="rt">The usual way — verbal</p>
              <p className="q">{"“Sir, I'll adjust ₹5 lakh for you at booking, trust me.”"}</p>
              <p className="rn">{"Nowhere in writing. No cost break-up. Gone the moment a hotter buyer walks in — and impossible to compare against anyone else."}</p>
            </div>
            <div className="rc rec">
              <p className="rt">The Deal Room — on record</p>
              <div className="doc">
                <div className="dr"><span>Offer price</span><b>₹2.11 Cr</b></div>
                <div className="dr"><span>All-in cost (documented)</span><b>₹2.26 Cr</b></div>
                <div className="dr"><span>Valid to</span><b>30 days</b></div>
              </div>
              <span className="stamp">Written offer · comparable · on file</span>
            </div>
          </div>
        </div>
      </section>

      {/* potential savings */}
      <section id="savings">
        <div className="wrap sec">
          <div>
            <p className="eyebrow">Potential savings</p>
            <h2>What the room is built to find — on your number.</h2>
            <p className="lede">{"The Deal Room is designed to surface offers 10–15% better than a solo buyer typically sees. Drag your budget to see what that's worth. A capability, not a promise — real outcomes depend on the project, market and timing."}</p>
          </div>

          <div className="calc">
            <div className="out2">
              <p className="cbudget">Your budget <b>{inr(budget)}</b></p>
              <input type="range" min={60} max={1000} step={5} value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Your budget in lakhs" />
              <div className="rangecap"><span>₹60 L</span><span>₹10 Cr</span></div>
            </div>
            <div className="save">
              <p className="sk">Potential saving</p>
              <p className="sv">{rangeStr(budget * 0.1, budget * 0.15)}</p>
              <p className="sn">{"On a " + inr(budget) + " purchase, at the room's 10–15% capability versus negotiating alone."}</p>
            </div>
          </div>

          <div className="examples">
            <div className="ex"><p className="eb">On ₹1.20 Cr</p><p className="es">₹12–18 L</p><p className="en">potential saving vs going alone</p></div>
            <div className="ex"><p className="eb">On ₹2.50 Cr</p><p className="es">₹25–38 L</p><p className="en">potential saving vs going alone</p></div>
            <div className="ex"><p className="eb">On ₹5.00 Cr</p><p className="es">₹50–75 L</p><p className="en">potential saving vs going alone</p></div>
          </div>
          <p className="cap-note">Illustrative ranges from the stated 10–15% capability — not a quote or a guaranteed outcome.</p>
        </div>
      </section>

      {/* offers table */}
      <section className="band">
        <div className="wrap sec">
          <div>
            <p className="eyebrow">What comes back</p>
            <h2>Not a sticker price. Offers you can actually compare.</h2>
            <p className="lede">The cheapest headline is rarely the best deal. Every offer lands on one table with the all-in number — so the true winner is obvious.</p>
          </div>
          <div className="offers">
            <div className="row head"><div>Source</div><div>Sticker</div><div className="hide-sm">All-in cost</div><div>Effective</div></div>
            <div className="row"><div className="who2">Seller · primary</div><div className="num">₹2.42 Cr</div><div className="num hide-sm">₹2.63 Cr</div><div className="num">₹2.58 Cr</div></div>
            <div className="row"><div className="who2">Broker A</div><div className="num">₹2.31 Cr</div><div className="num hide-sm">₹2.49 Cr</div><div className="num">₹2.44 Cr</div></div>
            <div className="row"><div className="who2">Resale</div><div className="num">₹2.20 Cr</div><div className="num hide-sm">₹2.40 Cr</div><div className="num">₹2.35 Cr</div></div>
            <div className="row win"><div className="who2">Seller · D &nbsp;<span className="pill">Best</span></div><div className="num">₹2.11 Cr</div><div className="num hide-sm">₹2.26 Cr</div><div className="num">₹2.21 Cr</div></div>
          </div>
          <p className="cap-note">Illustrative figures for a sample 3 BHK mandate — shown to demonstrate the format, not a quoted price.</p>
        </div>
      </section>

      {/* who pays whom */}
      <section>
        <div className="wrap sec">
          <div>
            <p className="eyebrow">Whose side are they on</p>
            <h2>{"Follow the money, and you'll know who's really working for you."}</h2>
          </div>
          <div className="pay">
            <div className="c"><p className="role">The traditional broker</p><p className="paidby">Paid by the deal</p><p className="desc">Wants a closure — any closure. The bigger and faster the deal, the bigger the cut.</p></div>
            <div className="c"><p className="role">The property portal</p><p className="paidby">Paid by developers</p><p className="desc">Shows what its advertisers pay to promote. The listings are inventory to move, not counsel.</p></div>
            <div className="c us"><p className="role">The Deal Room</p><p className="paidby">Paid by you — a flat fee</p><p className="desc">Optimises one thing: your outcome. No brokerage, no developer bias, no inventory to push.</p></div>
          </div>
        </div>
      </section>

      {/* faq */}
      <section>
        <div className="wrap sec" id="faq">
          <div><p className="eyebrow">Straight answers</p><h2>The questions every serious buyer asks.</h2></div>
          <div className="faq">
            <details open><summary>How are you different from a broker?<span className="pl">+</span></summary><div className="a">{"A broker is paid out of the deal, so a larger, faster purchase pays them more — their incentive sits opposite yours. We charge a flat fee, represent only you, and put every offer in writing. Our only job is to improve your outcome, not to close any deal."}</div></details>
            <details><summary>Who pays you?<span className="pl">+</span></summary><div className="a">{"You do — a flat fee, agreed up front. Not a percentage of the price, not a cut of the deal. Our fee doesn't move with what you pay, so we have no reason to want you to pay more."}</div></details>
            <details><summary>Do you take money from developers?<span className="pl">+</span></summary><div className="a">{"No. We take no brokerage and no promotion money from any developer or seller — ever. It's the line that lets us sit on your side of the table without a conflict."}</div></details>
            <details><summary>What kind of savings are realistic?<span className="pl">+</span></summary><div className="a">{"The room is built to surface offers meaningfully better than a solo buyer typically sees — often in the region of 10–15% versus negotiating alone. That's a capability, not a promise: outcomes depend on the project, the market and timing."}</div></details>
            <details><summary>{"What does “on record” actually mean?"}<span className="pl">+</span></summary><div className="a">{"Every offer we bring you is a written number with a full cost break-up and a validity date — not a verbal “I'll adjust it later”. You can compare them side by side and hold the seller to the terms."}</div></details>
            <details><summary>Is my information kept private?<span className="pl">+</span></summary><div className="a">{"Yes. What you share is used only to run your negotiation. We don't sell it, and we don't hand it to developers or brokers beyond the mandate you approve."}</div></details>
          </div>
        </div>
      </section>

      {/* close */}
      <section className="close" id="enter">
        <div className="wrap">
          <div className="in">
            <p className="eyebrow" style={{ color: "var(--green-soft)" }}>Enter the Deal Room</p>
            <h2>Have the market compete for your deal.</h2>
            <p>{"Start with a free audit of what you're eyeing. You're never committed to transact — you decide, in writing, if and when an offer is genuinely worth taking."}</p>
            <div style={{ marginTop: "34px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
              <button className="btn btn-go" onClick={onEnter}>Enter the Deal Room →</button>
              <a className="btn btn-ghost" href="#work" style={{ padding: "15px 22px" }}>See how it works</a>
            </div>
            <p style={{ marginTop: "18px", fontSize: "12.5px", color: "var(--ink-faint)" }}>Flat fee · no brokerage · no developer money · every offer on record</p>
          </div>
        </div>
      </section>
    </div>
  );
}
