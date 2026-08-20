"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectWireItem } from "@/lib/supabase";
import DispatchStories from "./DispatchStories";
import OtpDigits from "@/components/auth/OtpDigits";
import { saveLead, setPendingLead, isSignedIn, AUTH_EVENT, loadAccount } from "@/lib/journey";
import {
  normalisePhone, normaliseIntl, prettyPhone, phoneKnown,
  sendOtp, sendTwilioOtp, verifyOtp, verifyTwilioOtp, signInWithGoogle, getSession, OTP_LENGTH,
} from "@/lib/phoneAuth";
import { track } from "@/lib/events";

/* ════════════════════════════════════════════════════════════════
   NEWS & UPDATES — the project's chronological, source-verified log of
   real-world events (RERA filings, construction milestones, JVs, corridor
   infra, pricing moves), each with a buyer-side forensic read.

   Named "Project Intelligence Wire" internally (file/prop names kept to
   avoid churn); the reader only ever sees "News & Updates".

   Reader-facing behaviour, per the founder:
   · Newest first, "Landmark Catalyst" pinned on top.
   · TWO VIEWS of the same events, and the reader chooses:
       Stories (default) — vertical, autoplaying, phone-native. Every
         dispatch is in the DOM; see DispatchStories.
       List — the chronological timeline: 2 shown, "Load more" reveals
         the rest. Free to read either way, no sign-up.
     Only the presentation differs. Same items, same sort, same filter,
     same words — so nothing a crawler or a reader can see depends on
     which view is up.
   · The rail is impact-coded (green/amber/red on the node + card edge) so it
     scans as a risk/catalyst map, not just a stack of cards.
   · The watch banner is a PROPER sign-up: signed-out readers go through the
     same phone-OTP (+ Google) flow the rest of the site uses — India & NRI —
     tagged intent "wire-alert" so the sign-in records a contact_lead on the
     backend; a signed-in reader gets a one-click watch. ONE per section:
     the band below the timeline in list view, the story's end card in
     stories view — the same component either way, never two at once.
   ════════════════════════════════════════════════════════════════ */

const INITIAL_SHOWN = 2;

/* Same dialling set the unlock sheet offers — India first, then the NRI
   corridors. Keep in step with UnlockModal's DIAL. */
const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
  { code: "+966", flag: "🇸🇦" }, { code: "+49", flag: "🇩🇪" }, { code: "+974", flag: "🇶🇦" },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string; chip: string }> = {
  ALL: { label: "All", icon: "🗂", chip: "" },
  CONSTRUCTION: { label: "Construction", icon: "🏗️", chip: "bg-sky-500/10 text-sky-700 border-sky-500/20" },
  REGULATORY: { label: "Regulatory & RERA", icon: "⚖️", chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  INFRASTRUCTURE: { label: "Corridor Infra", icon: "🚇", chip: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  CORPORATE_JV: { label: "Institutional JV", icon: "🏢", chip: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
  PRICING: { label: "Pricing & Sales", icon: "💹", chip: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  LEGAL: { label: "Legal & Litigation", icon: "📜", chip: "bg-red-500/10 text-red-700 border-red-500/20" },
};

/* Impact drives the SCAN: the node ring + the card's left edge carry the
   colour, so a reader running an eye down the rail sees where the catalysts
   and the risks are before reading a word. The read-box below repeats it. */
const IMPACT_STYLES: Record<string, { label: string; icon: string; node: string; edge: string; box: string; text: string }> = {
  POSITIVE: { label: "Positive Catalyst", icon: "🟢", node: "border-emerald-500 text-emerald-700", edge: "border-l-emerald-500", box: "border-emerald-500/25 bg-emerald-500/5", text: "text-emerald-900" },
  NEUTRAL:  { label: "Neutral / Statutory", icon: "⚪", node: "border-slate-400 text-slate-600", edge: "border-l-slate-400", box: "border-slate-500/25 bg-slate-500/5", text: "text-slate-900" },
  CAUTION:  { label: "Forensic Caution", icon: "🟡", node: "border-amber-500 text-amber-700", edge: "border-l-amber-500", box: "border-amber-500/30 bg-amber-500/[0.08]", text: "text-amber-950" },
  RISK:     { label: "Execution / Legal Risk", icon: "🔴", node: "border-red-500 text-red-700", edge: "border-l-red-500", box: "border-red-500/30 bg-red-500/[0.08]", text: "text-red-950" },
};

function formatDate(dStr: string) {
  try {
    return new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dStr;
  }
}

/* Newest first; a pinned "Landmark Catalyst" floats above the rest regardless
   of date. Sort is stable enough for our sizes; ties keep supplied order. */
function sortNewestFirst(items: ProjectWireItem[]): ProjectWireItem[] {
  return [...items].sort((a, b) => {
    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
    const ta = Date.parse(a.eventDate) || 0;
    const tb = Date.parse(b.eventDate) || 0;
    return tb - ta;
  });
}

export default function ProjectIntelligenceWire({
  items,
  projectName,
  placement,
}: {
  items?: ProjectWireItem[] | null;
  projectName: string;
  /* Where this instance is rendered — "locked" (after Ch II, the free
     engagement probe) or "unlocked" (between Ch III and IV). Stamped onto the
     engagement events so the two can be read apart. */
  placement?: "locked" | "unlocked";
}) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [expanded, setExpanded] = useState(false);
  /* Stories is the default view. The timeline stays one tap away — a
     reader scanning twenty dispatches for one fact wants a list, and a
     printed or Reader-mode page wants one too. */
  const [view, setView] = useState<"stories" | "list">("stories");

  const wireList = useMemo(() => sortNewestFirst(items ?? []), [items]);

  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    wireList.forEach((it) => set.add(it.category));
    return ["ALL", ...Array.from(set)];
  }, [wireList]);

  const filteredItems = useMemo(
    () => (activeCategory === "ALL" ? wireList : wireList.filter((it) => it.category === activeCategory)),
    [wireList, activeCategory],
  );

  /* Engagement: the section rendered with items. Fires once per mounted
     instance (the locked and unlocked placements are separate mounts, each
     stamped with its own placement), batched with the page's other events. */
  useEffect(() => {
    if (!wireList.length) return;
    track("news_viewed", { props: { project: projectName, placement: placement ?? "unknown", count: wireList.length } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName]);

  const shown = expanded ? filteredItems : filteredItems.slice(0, INITIAL_SHOWN);
  const hiddenCount = filteredItems.length - shown.length;

  if (!wireList.length) return null;

  return (
    <section id="news" aria-labelledby="news-heading" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1a1a1a]/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live
            </span>
            <span className="text-[0.72rem] text-[#1a1a1a]/50">{wireList.length} verified update{wireList.length === 1 ? "" : "s"}</span>
          </div>
          <h2 id="news-heading" className="mt-2 font-serif text-[1.65rem] font-medium leading-tight text-[#1a1a1a] md:text-[2rem]">
            News &amp; Updates
          </h2>
          <p className="mt-1 max-w-2xl text-[0.84rem] text-[#1a1a1a]/65">
            Every verified ground event on {projectName} — filings, construction, JVs, corridor infrastructure and pricing — read for what it means to a buyer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View switch — stories or the timeline, reader's choice. */}
          <div className="flex items-center rounded-lg border border-[#1a1a1a]/12 bg-white p-0.5" role="group" aria-label="News display">
            {([["stories", "Stories"], ["list", "List"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (view === key) return;
                  setView(key);
                  track("news_view_changed", { props: { project: projectName, placement: placement ?? "unknown", view: key } });
                }}
                aria-pressed={view === key}
                className={`rounded-md px-2.5 py-1 text-[0.74rem] font-medium transition-colors ${
                  view === key ? "bg-[#14110d] text-[#f6f1e8]" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

        {/* Category filters — reset the expand state so "Load more" always
            reflects the filtered count. */}
        {categoriesPresent.length > 2 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categoriesPresent.map((catKey) => {
              const meta = CATEGORY_LABELS[catKey] || { label: catKey, icon: "📌", chip: "" };
              const isActive = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => { setActiveCategory(catKey); setExpanded(false); }}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-medium transition-all ${
                    isActive
                      ? "bg-[#14110d] text-[#f6f1e8] shadow-sm"
                      : "border border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/70 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
                  }`}
                >
                  <span aria-hidden>{meta.icon}</span>
                  <span>{meta.label}</span>
                  {catKey === "ALL" && <span className="ml-0.5 text-[0.68rem] opacity-70">({wireList.length})</span>}
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* ── Stories ──
          The default view. Filtered items, so the category chips drive
          the story set exactly as they drive the list. The end card is
          the real WatchBanner in its story dress — one component, one
          auth flow, one lead. */}
      {view === "stories" && (
        <DispatchStories
          key={activeCategory /* a filter change is a new run, not a seek */}
          items={filteredItems}
          endCard={<WatchBanner projectName={projectName} variant="story" />}
          onAdvance={(i) => track("news_story_advanced", { props: { project: projectName, placement: placement ?? "unknown", index: i, total: filteredItems.length } })}
          onComplete={() => track("news_story_completed", { props: { project: projectName, placement: placement ?? "unknown", total: filteredItems.length } })}
        />
      )}

      {/* ── Timeline ── */}
      {view === "list" && (
      <div className="relative mt-6 space-y-5 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-[2px] before:bg-gradient-to-b before:from-[#c9a96e]/50 before:via-[#1a1a1a]/12 before:to-transparent">
        {shown.map((item, idx) => {
          const catMeta = CATEGORY_LABELS[item.category] || { label: item.category, icon: "📌", chip: "bg-slate-100 text-slate-700" };
          const impact = IMPACT_STYLES[item.forensicImpactType] || IMPACT_STYLES.NEUTRAL;
          return (
            <article
              key={item.id || idx}
              className={`relative ml-9 rounded-2xl border border-l-[3px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] md:p-7 ${impact.edge} ${
                item.isPinned ? "border-[#c9a96e]/60 ring-1 ring-[#c9a96e]/25" : "border-[#1a1a1a]/10"
              }`}
            >
              {/* Node — category icon, ringed in the impact colour so the rail
                  reads as a risk/catalyst map at a glance. */}
              <div
                aria-hidden
                className={`absolute -left-[2.85rem] top-6 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-[0.8rem] shadow-sm ${impact.node}`}
                title={impact.label}
              >
                {catMeta.icon}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a]/8 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.75rem] font-semibold text-[#1a1a1a]/70">{formatDate(item.eventDate)}</span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.68rem] font-medium ${catMeta.chip}`}>
                    <span aria-hidden>{catMeta.icon}</span>
                    <span>{catMeta.label}</span>
                  </span>
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#c9a96e]/40 bg-[#c9a96e]/15 px-2 py-0.5 text-[0.63rem] font-bold uppercase tracking-wider text-[#9a7a2e]">
                      📌 Landmark
                    </span>
                  )}
                </div>
                {item.sourceName && (
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-[#1a1a1a]/50">
                    <span>Source:</span>
                    <span className="font-medium text-[#1a1a1a]/80">{item.sourceName}</span>
                  </div>
                )}
              </div>

              <h3 className="mt-3.5 font-serif text-[1.18rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.32rem]">
                {item.headline}
              </h3>

              {item.verifiedFacts && (
                <div className="mt-3 space-y-1.5 text-[0.85rem] leading-relaxed text-[#1a1a1a]/80">
                  {item.verifiedFacts.split("\n").map((line, lIdx) => {
                    const clean = line.trim();
                    if (!clean) return null;
                    return (
                      <p key={lIdx} className="flex items-start gap-2">
                        <span className="text-[#9a7a2e]">•</span>
                        <span>{clean.replace(/^[•\-*]\s*/, "")}</span>
                      </p>
                    );
                  })}
                </div>
              )}

              {item.forensicImpactSummary && (
                <div className={`mt-5 rounded-xl border p-4 ${impact.box}`}>
                  <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#9a7a2e]">
                    <span aria-hidden>{impact.icon}</span>
                    <span>Forensic impact read</span>
                  </div>
                  <p className={`mt-1.5 text-[0.82rem] leading-relaxed ${impact.text}`}>{item.forensicImpactSummary}</p>
                </div>
              )}

              {(item.sourceDocumentRef || item.sourceUrl) && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a1a]/6 pt-3 text-[0.72rem] text-[#1a1a1a]/55">
                  {item.sourceDocumentRef ? (
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-[#1a1a1a]/40">Docket / Ref:</span>
                      <span className="text-[#1a1a1a]/80">{item.sourceDocumentRef}</span>
                    </div>
                  ) : <span />}
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#9a7a2e] underline-offset-4 hover:underline">
                      <span>Verify primary filing</span>
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      )}

      {/* Load more / less — free to read, no sign-up. List view only:
          in stories every dispatch is already in the run. */}
      {view === "list" && filteredItems.length > INITIAL_SHOWN && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => {
              // Engagement signal — fire only on the expand ("load more")
              // direction, before flipping state (no side effect in the updater).
              if (!expanded) {
                track("news_load_more", {
                  props: { project: projectName, placement: placement ?? "unknown", shownBefore: INITIAL_SHOWN, total: filteredItems.length, category: activeCategory },
                });
              }
              setExpanded((v) => !v);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-white px-5 py-2.5 text-[0.8rem] font-semibold text-[#1a1a1a]/75 transition-colors hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
          >
            {expanded ? "Show less" : `Load more — ${hiddenCount} earlier update${hiddenCount === 1 ? "" : "s"}`}
            <span aria-hidden className={`transition-transform ${expanded ? "rotate-180" : ""}`}>↓</span>
          </button>
        </div>
      )}

      {/* ── Watch banner ──
          List view only. In stories the same component is the end card,
          and two sign-ups in one section would compete with each other. */}
      {view === "list" && <WatchBanner projectName={projectName} />}
    </section>
  );
}

/* ── The watch sign-up ────────────────────────────────────────────────────
   A proper sign-up, consistent with every other surface: signed-out readers
   go through the shared phone-OTP flow (India via MSG91, NRI via Twilio) or
   Google, with the intent declared BEFORE auth so the sign-in records a
   "wire-alert" contact_lead on the backend (flushPendingLead, inside verify).
   A signed-in reader just taps once — the lead is recorded against the
   identity we already hold.

   `variant` changes NOTHING but the wrapper's classes. "band" is the
   full-width block under the timeline; "story" drops the card chrome and
   stacks, because the story slide it sits inside already provides the
   dark surface, the gold edge and the padding. Every state, every
   string, every network call and the lead itself are identical — which
   is the point of reusing the component instead of copying it. */
export function WatchBanner({ projectName, variant = "band" }: { projectName: string; variant?: "band" | "story" }) {
  const story = variant === "story";
  const [signedIn, setSignedIn] = useState(false);
  const [done, setDone] = useState(false);

  // sign-up state (signed-out path)
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sent, setSent] = useState(false);
  const [known, setKnown] = useState<boolean | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const otpRef = useRef(otp);
  otpRef.current = otp;

  const isIndia = dial === "+91";

  useEffect(() => {
    const sync = () => setSignedIn(isSignedIn());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  /* One-tap for a reader we already know — record the wire-alert intent
     against their stored identity, no second sign-up. */
  function watchAsMember() {
    const acct = loadAccount();
    const session = getSession();
    const phone = session?.phone ?? "";
    const email = session?.email ?? "";
    saveLead({
      name: acct?.name ?? "",
      email,
      phone,
      project: projectName,
      intent: "wire-alert",
      message: `Wire alert watch — ${projectName}`,
      createdAt: Date.now(),
    });
    track("lead_captured", { props: { source: "news-watch", intent: "wire-alert", member: true } });
    setDone(true);
  }

  async function sendCode() {
    if (busy) return;
    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) { setErr("That number doesn't look right — mind checking it?"); return; }
    setErr(""); setBusy(true);
    track("sign_up_form_opened", { props: { source: "news-watch" } });
    // Declare intent BEFORE auth so the sign-in records a wire-alert lead
    // (and survives the Google redirect).
    setPendingLead({ intent: "wire-alert", project: projectName });
    const [r, k] = await Promise.all([
      isIndia ? sendOtp(ten) : sendTwilioOtp(dial, num),
      phoneKnown(ten, dial),
    ]);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setKnown(k);
    setOtp(Array(OTP_LENGTH).fill(""));
    setSent(true);
  }

  async function verify() {
    if (busy) return;
    if (known !== true && !name.trim()) { setErr("Please enter your name."); return; }
    const code = otpRef.current.join("");
    if (code.replace(/\D/g, "").length < OTP_LENGTH) { setErr(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) { setErr("That number doesn't look right — go back and check it."); return; }
    setErr(""); setBusy(true);
    // wire-alert intent is already pending → flushPendingLead (inside verify)
    // records the contact_lead the instant the code checks out.
    const r = isIndia
      ? await verifyOtp(ten, code, name.trim(), dial)
      : await verifyTwilioOtp(dial, num, code, name.trim());
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setDone(true);
  }

  async function google() {
    if (busy) return;
    setBusy(true); setErr("");
    setPendingLead({ intent: "wire-alert", project: projectName }); // consumed in /auth/callback
    const r = await signInWithGoogle();
    if (!r.ok) { setBusy(false); setErr(r.error ?? "Google sign-in didn't start — try the number."); }
  }

  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const sentTo = isIndia && normalisePhone(num) ? `${dial} ${prettyPhone(normalisePhone(num)!)}` : `${dial} ${num.trim()}`;

  /* One style map, two dresses. Every control below reads from S, so the
     two variants can look nothing alike while sharing a single code path
     — the states, the calls and the lead are the same object either way.

     "story" is LIGHT on purpose. It sits at the end of a deck of
     near-black news cards, and the founder's note was contrast: an
     ivory card among black ones reads instantly as a different kind of
     thing — an invitation, not another dispatch. The band keeps the
     dark dress it already ships in. */
  const S = story
    ? {
        eyebrow: "text-[#9a7a2e]",
        head: "text-[1.15rem] text-[#1a1a1a]",
        select: "rounded-lg border border-[#1a1a1a]/15 bg-white px-2 py-2.5 text-[0.82rem] text-[#1a1a1a] outline-none focus:border-[#9a7a2e]",
        field: "rounded-lg border border-[#1a1a1a]/15 bg-white px-3 py-2.5 text-[0.82rem] text-[#1a1a1a] placeholder-[#1a1a1a]/35 outline-none focus:border-[#9a7a2e]",
        /* Ink on ivory — the inverse of the dispatch cards, so the one
           action on this card is the darkest thing on it. The disabled
           state is styled rather than faded: black at 40% opacity over
           ivory reads as a broken button, where a flat grey pill reads
           as "not yet". */
        cta: "w-full rounded-lg bg-[#14110d] px-4 py-2.5 text-[0.78rem] font-semibold text-[#F5F0E8] transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#1a1a1a]/15 disabled:text-[#1a1a1a]/45 disabled:opacity-100",
        ghost: "flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#1a1a1a]/15 bg-white py-2.5 text-[0.8rem] font-medium text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]/35 disabled:opacity-50",
        rule: "bg-[#1a1a1a]/12",
        ruleText: "text-[#1a1a1a]/40",
        muted: "text-[#1a1a1a]/55",
        strong: "text-[#1a1a1a]",
        link: "text-[#9a7a2e]",
        err: "text-[#b0503e]",
        ok: "rounded-lg border border-[#1e6b45]/30 bg-[#1e6b45]/10 p-3.5 text-center text-[0.8rem] font-medium text-[#1e6b45]",
        otpBox: "h-11 min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/20 bg-white text-center font-serif text-[1.2rem] text-[#1a1a1a] outline-none focus:border-[#9a7a2e] focus:ring-2 focus:ring-[#9a7a2e]/25",
      }
    : {
        eyebrow: "text-[#c9a96e]",
        head: "text-[1.3rem] text-white md:text-[1.5rem]",
        select: "rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 text-[0.82rem] text-white outline-none backdrop-blur-md focus:border-[#c9a96e] [&>option]:text-[#14110d]",
        field: "rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[0.82rem] text-white placeholder-white/40 backdrop-blur-md transition-colors focus:border-[#c9a96e] focus:outline-none",
        cta: "w-full rounded-xl bg-gradient-to-r from-[#e4cca0] to-[#c9a96e] px-4 py-2.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#14110d] shadow-[0_4px_16px_rgba(201,169,110,0.25)] transition-all hover:from-[#f0dbb2] hover:to-[#d8b978] disabled:opacity-50",
        ghost: "flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] py-2.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50",
        rule: "bg-white/12",
        ruleText: "text-white/35",
        muted: "text-white/60",
        strong: "text-white",
        link: "text-[#c9a96e]",
        err: "text-rose-300",
        ok: "rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-[0.82rem] font-medium text-emerald-300",
        otpBox: "h-12 min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 text-center font-serif text-[1.25rem] text-white outline-none focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/30",
      };

  return (
    <div className={story ? "" : "mt-8 overflow-hidden rounded-2xl border border-[#c9a96e]/35 bg-[#14110d] p-6 text-[#f6f1e8] shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:p-8"}>
      <div className={story ? "flex flex-col gap-4" : "flex flex-col justify-between gap-6 lg:flex-row lg:items-center"}>
        {/* Pitch. The band lists three promises because it has the width
            for them. The story card does not, and does not need them: at
            the end of a deck of dispatches the reader has just watched
            what "news" means here, so one line is the whole argument. */}
        <div className={story ? "" : "max-w-xl"}>
          <span className={`text-[0.62rem] font-bold uppercase tracking-[0.2em] ${S.eyebrow}`}>
            {story ? "News alerts" : "Discrete ground intelligence"}
          </span>
          <h4 className={`mt-1.5 font-serif font-normal leading-tight ${S.head}`}>
            {story ? "Get the latest, first." : `Get ${projectName} on the watch`}
          </h4>
          {story ? (
            /* The project name lives in the small line, not the headline:
               names run from "Trevoc Royal" to "Signature Global Titanium
               SPR Sector 71" and a headline that reflows to four lines on
               the long ones is not a headline. */
            <p className={`mt-2 text-[0.74rem] leading-relaxed ${S.muted}`}>
              Verified news on {projectName}, the moment it lands. No spam.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-[0.82rem] leading-relaxed text-[#f6f1e8]/70">
              <li className="flex items-start gap-2"><span aria-hidden>🔔</span><span>A personal heads-up the moment a real event lands — a new filing, RERA slippage, a corridor change.</span></li>
              <li className="flex items-start gap-2"><span aria-hidden>🤝</span><span>Concierge, by a human advisor — not a broker blast.</span></li>
              <li className="flex items-start gap-2"><span aria-hidden>🔒</span><span>Zero spam. Ever.</span></li>
            </ul>
          )}
        </div>

        {/* Action */}
        <div className={story ? "" : "shrink-0 lg:w-[21rem]"}>
          {done ? (
            <div className={S.ok}>
              ✓ You&rsquo;re on the watch for {projectName}. An advisor confirms and sends verified updates as they land.
            </div>
          ) : signedIn ? (
            <button
              type="button"
              onClick={watchAsMember}
              className={S.cta}
            >
              {story ? "Notify me" : "Add me to the watch 🔔"}
            </button>
          ) : !sent ? (
            <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-2.5">
              <div className="flex gap-2">
                <select
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  aria-label="Country code"
                  className={S.select}
                >
                  {DIAL.map((d) => <option key={d.code} value={d.code}>{d.flag} {d.code}</option>)}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder={isIndia ? "Your mobile number" : "Mobile number"}
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                  className={`min-w-0 flex-1 ${S.field}`}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !numValid}
                className={S.cta}
              >
                {busy ? "Sending…" : story ? "Notify me" : "Add me to the watch 🔔"}
              </button>
              <div className={`flex items-center gap-3 py-0.5 text-[0.66rem] ${S.ruleText}`}><span className={`h-px flex-1 ${S.rule}`} />or<span className={`h-px flex-1 ${S.rule}`} /></div>
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className={S.ghost}
              >
                <GoogleG /> Continue with Google
              </button>
              {err && <p className={`text-[0.72rem] font-medium ${S.err}`}>{err}</p>}
            </form>
          ) : (
            <div className="space-y-2.5">
              <p className={`text-[0.76rem] ${S.muted}`}>
                Code sent to <span className={`font-medium ${S.strong}`}>{sentTo}</span>
                {" · "}
                <button type="button" onClick={() => { setSent(false); setKnown(undefined); setOtp(Array(OTP_LENGTH).fill("")); setErr(""); }} className={`font-medium hover:underline ${S.link}`}>Change</button>
              </p>
              {known !== true && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={`w-full ${S.field}`}
                />
              )}
              <OtpDigits
                value={otp}
                onChange={setOtp}
                len={OTP_LENGTH}
                autoFocus
                onComplete={verify}
                boxClass={S.otpBox}
              />
              <button
                type="button"
                onClick={verify}
                disabled={busy}
                className={S.cta}
              >
                {busy ? "Verifying…" : "Verify & watch →"}
              </button>
              {err && <p className={`text-[0.72rem] font-medium ${S.err}`}>{err}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GoogleG = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23.7 12.3c0-.7-.1-1.4-.2-2.1H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-9.1z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.8-2.1-6.7-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3c-.3-.7-.4-1.5-.4-2.3s.1-1.5.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" />
  </svg>
);
