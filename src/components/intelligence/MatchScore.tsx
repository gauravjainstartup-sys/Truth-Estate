"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadBuyData,
  saveBuyData,
  hasPreferences,
  matchScoreFor,
  matchLabel,
  emptyBuyData,
  buyerFromBuyData,
  setMember,
  isMember,
  corridorKey,
  LOCATIONS,
  type BuyData,
} from "@/lib/journey";
import { scoreMatch, type MarketContext } from "@/lib/matchEngine";
import { useMatchMarket } from "@/lib/useMatchCatalog";
import { saveVerified, loadVerified, maskContact, type Verified } from "@/lib/shortlistAuth";
import { useReportStatic } from "./reportStatic";
import OtpSheet from "@/components/shortlist/OtpSheet";
import type { ProjectIntel } from "@/lib/projects";

const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";
const POI_ENABLED = !!GMAPS_KEY;

const BUDGETS = [
  { label: "Under ₹3 Cr", cr: 2 },
  { label: "₹3–5 Cr", cr: 4 },
  { label: "₹5–8 Cr", cr: 6 },
  { label: "₹8–12 Cr", cr: 10 },
  { label: "₹12 Cr +", cr: 14 },
];
const CONFIG_CHIPS = ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse"];
// "What matters most" is persona-specific — an investor and an end-user care
// about different things, and each chip boosts its matching engine factor.
const PRIORITY_BY_PERSONA = {
  "end-user": ["Legal Safety", "On-Time Delivery", "Layouts", "Luxury Lifestyle", "Location"],
  investor: ["Capital Appreciation", "Rental Yield", "Value Buying", "Liquidity", "Location"],
} as const;
const EXIT_YEARS = [3, 5, 7, 10];
type Persona = "end-user" | "investor";

const toneClass = { good: "text-[#1e6b45]", fair: "text-[#9a7a2e]", low: "text-[#b0503e]" } as const;
type Draft = { persona: Persona; budgetCr: number; configs: string[]; locations: string[]; priorities: string[]; exitYears: number | null; poi: { lat: number; lng: number; label: string } | null };

/* Corridor chips for the location step. The engine matches a buyer corridor to
   a project's corridor by EXACT string (and looks the centroid up by that same
   string), so the values MUST be the live corridor names — but those come in
   long, parenthesised, and near-duplicated ("Golf Course Road (GCR)" vs
   "Golf Course Road (Sectors 27–56)"). Group them by canonical corridorKey so
   the buyer sees one clean chip per corridor; selecting it selects EVERY
   underlying live string, so both the exact-match and centroid lookups fire.
   Data-side adaptation only — the buyer's mental model stays "SPR / GCE / Sohna". */
type CorridorChip = { label: string; keys: string[] };
function corridorChips(market: MarketContext): CorridorChip[] {
  const groups: Record<string, string[]> = {};
  for (const c of Object.keys(market.corridorCentroid)) (groups[corridorKey(c)] ??= []).push(c);
  const label = (canon: string, sample: string) =>
    LOCATIONS.find((l) => corridorKey(l) === canon) ?? sample.replace(/\s*\(.*$/, "").trim();
  return Object.entries(groups).map(([canon, keys]) => ({ label: label(canon, keys[0]), keys }));
}

export default function MatchScore({ project, initialBuy, variant = "card" }: { project: ProjectIntel; initialBuy?: BuyData | null; variant?: "card" | "band" }) {
  const [buy, setBuy] = useState<BuyData | null>(initialBuy ?? null);
  const [sheet, setSheet] = useState(false);
  // Identity — anonymous until verified. Drives the login / save-your-brief
  // affordances in the sheet (real account sync lands with Supabase Auth; today
  // OTP marks membership and the brief is already local). `otp` names the intent
  // so the OTP sheet frames itself as a log-in or a save.
  const [member, setMemberFlag] = useState(false);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [otp, setOtp] = useState<null | "login" | "save">(null);
  /* The frozen sample renders MatchScore for its hero, but must not carry the
     phone-signup machinery — those sheets are fixed overlays that escape the
     sheet's button-hiding, so gate them out entirely in static mode. */
  const isStatic = useReportStatic();

  useEffect(() => {
    if (!initialBuy) {
      const saved = loadBuyData();
      if (saved) setBuy(saved);
    }
    setMemberFlag(isMember());
    setVerified(loadVerified());
  }, [initialBuy]);

  function handleVerified(v: Verified) {
    saveVerified(v);
    setMember();
    setMemberFlag(true);
    setVerified(v);
    setOtp(null);
    // Phase 3 (Supabase Auth): hydrate this buyer's saved brief from their
    // account here and setBuy(...) — until then the brief is already local.
  }

  const market = useMatchMarket();
  const computed = buy && hasPreferences(buy);
  // The persona match engine drives the score when the project carries live
  // matchInput; the mock fallback set (no matchInput) keeps the legacy score.
  const engine = computed && buy && project.matchInput ? scoreMatch(project.matchInput, buyerFromBuyData(buy), market) : null;
  const pct = engine ? engine.pct : computed && buy ? matchScoreFor(project, buy) : null;
  const meta = engine ? { label: engine.label, tone: engine.tone } : pct != null ? matchLabel(pct) : null;
  const bandRead = engine
    ? engine.subline
    : (() => {
        if (!computed || !buy) return "";
        const okB = project.budget[0] - 1 <= buy.budgetCr && buy.budgetCr <= project.budget[1] + 2;
        const okC = buy.configs.length === 0 || project.configs.some((c) => buy.configs.includes(c));
        const okP = buy.priorities.length > 0 && buy.priorities.some((t) => project.tags.includes(t));
        const fits = [okB && "budget", okC && "configuration", okP && "priorities"].filter(Boolean) as string[];
        const gaps = [!okB && "budget", !okC && "configuration", buy.priorities.length > 0 && !okP && "priorities"].filter(Boolean) as string[];
        if (gaps.length === 0) return "Fits your budget, configuration and priorities.";
        if (fits.length === 0) return `Worth a closer look on ${gaps.join(" & ")}.`;
        return `${fits.join(" & ").replace(/^./, (m) => m.toUpperCase())} fit; ${gaps.join(" & ")} to look at.`;
      })();

  function onSave(next: BuyData) {
    saveBuyData(next);
    setBuy(next);
    setSheet(false);
  }

  const seed: Draft = {
    persona: buy?.purchaseType === "Investment" ? "investor" : "end-user",
    budgetCr: buy?.budgetCr ?? 6,
    configs: buy?.configs ?? [],
    locations: buy?.locations ?? [],
    priorities: buy?.priorities ?? [],
    exitYears: buy?.exitYears ?? null,
    poi: buy?.poi ? { lat: buy.poi.lat, lng: buy.poi.lng, label: buy.poi.label ?? "" } : null,
  };

  return (
    <section id="match" className={variant === "band" ? "scroll-mt-28" : "mt-6 scroll-mt-24"}>
      {variant === "band" ? (
        computed ? (
          <a onClick={() => setSheet(true)} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.05] px-5 py-4 transition-colors hover:bg-[#9a7a2e]/[0.08] sm:gap-5 sm:px-6">
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span className={`font-serif text-[2.5rem] font-normal leading-none ${toneClass[meta!.tone]}`}>{pct}</span>
              <span className="font-mono text-[0.78rem] text-[#1a1a1a]/35">%</span>
            </div>
            <div className="h-11 w-px shrink-0 bg-[#9a7a2e]/25" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.5rem] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/40">Your Fit</p>
              <p className={`text-[0.9rem] font-semibold ${toneClass[meta!.tone]}`}>{meta!.label} for you</p>
              <p className="mt-0.5 text-[0.78rem] font-light leading-snug text-[#1a1a1a]/55">{bandRead}</p>
            </div>
            <span className="hidden shrink-0 text-[0.72rem] font-semibold text-[#9a7a2e] transition-colors group-hover:text-[#7a5f1e] sm:inline">Adjust →</span>
          </a>
        ) : (
          <button onClick={() => setSheet(true)} className="group flex w-full items-center gap-4 rounded-2xl border border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.05] px-5 py-4 text-left transition-colors hover:bg-[#9a7a2e]/[0.09] sm:gap-5 sm:px-6">
            <div className="relative flex shrink-0 items-baseline gap-0.5">
              <span className="select-none font-serif text-[2.5rem] font-normal leading-none text-[#9a7a2e]/70 blur-[7px]" aria-hidden>72</span>
              <span className="select-none font-mono text-[0.78rem] text-[#1a1a1a]/35 blur-[3px]" aria-hidden>%</span>
              <span className="absolute inset-0 flex items-center justify-center text-[1rem]" aria-hidden>🔒</span>
            </div>
            <div className="h-11 w-px shrink-0 bg-[#9a7a2e]/25" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.5rem] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/40">Your Fit</p>
              <p className="text-[0.9rem] font-semibold text-[#9a7a2e]">Locked — reveal your fit</p>
              <p className="mt-0.5 text-[0.78rem] font-light leading-snug text-[#1a1a1a]/55">Set your preferences · 20s, scored against <span className="italic">your</span> brief, not the brochure.</p>
            </div>
            <span className="hidden shrink-0 text-[0.72rem] font-semibold text-[#9a7a2e] transition-colors group-hover:text-[#7a5f1e] sm:inline">Reveal →</span>
          </button>
        )
      ) : computed ? (
        /* Computed — the score, kept compact, with the fit read-out */
        <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
          <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="flex flex-col justify-center border-b border-[#1a1a1a]/8 bg-white/50 p-7 md:border-b-0 md:border-r">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">Match Score</p>
              <p className={`mt-3 font-mono text-[3.2rem] font-light leading-none ${toneClass[meta!.tone]}`}>{pct}%</p>
              <p className={`mt-2 text-[0.86rem] font-medium ${toneClass[meta!.tone]}`}>{meta!.label} for you</p>
              <button onClick={() => setSheet(true)} className="mt-4 self-start text-[0.76rem] font-medium text-[#1a1a1a]/50 underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">
                Edit preferences
              </button>
            </div>
            <div className="p-7">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">How we read your fit</p>
              <ul className="mt-4 space-y-2.5">
                <FitRow ok={project.budget[0] - 1 <= buy!.budgetCr && buy!.budgetCr <= project.budget[1] + 2} label={`Budget · ₹${project.budget[0]}–${project.budget[1]} Cr ticket`} />
                <FitRow ok={buy!.configs.length === 0 || project.configs.some((c) => buy!.configs.includes(c))} label={`Configuration · ${project.configs.join(", ")}`} />
                <FitRow ok={buy!.priorities.some((t) => project.tags.includes(t))} label={`Priorities · ${buy!.priorities.length ? buy!.priorities.join(", ") : "none set"}`} />
              </ul>
              <p className="mt-5 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/45">
                Want this scored against your full brief and shortlisted alongside better-fit options? An advisor does that with you.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Cold — the score sits blurred behind a lock until the buyer sets a brief */
        <button onClick={() => setSheet(true)} className="group block w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60 text-left transition-colors hover:border-[#9a7a2e]/40">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:gap-7 md:p-7">
            <div className="relative shrink-0 self-start">
              <p className="select-none font-mono text-[3.2rem] font-light leading-none text-[#9a7a2e]/70 blur-[9px]" aria-hidden>72%</p>
              <span className="absolute inset-0 flex items-center justify-center text-[1.5rem]" aria-hidden>🔒</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">Match Score</p>
              <p className="mt-2 font-serif text-[1.5rem] leading-[1.15] text-[#1a1a1a] md:text-[1.7rem]">Your fit is locked</p>
              <p className="mt-2 text-[0.85rem] font-light leading-[1.6] text-[#1a1a1a]/50">
                Set your preferences — 20 seconds — and we&apos;ll reveal how this scores against <span className="italic">your</span> brief, not the brochure.
              </p>
            </div>
            <span className="shrink-0 rounded-sm bg-[#1e6b45] px-6 py-3.5 text-[0.84rem] font-semibold tracking-[0.02em] text-white transition-colors group-hover:bg-[#238c55]">Reveal my fit →</span>
          </div>
        </button>
      )}

      {!isStatic && (
        <>
          <MatchSheet
            open={sheet}
            project={project}
            market={market}
            seed={seed}
            computed={!!computed}
            existing={buy}
            member={member}
            verified={verified}
            onClose={() => setSheet(false)}
            onSave={onSave}
            onLogin={() => setOtp("login")}
            onSaveBrief={() => setOtp("save")}
          />
          <OtpSheet
            open={otp !== null}
            onClose={() => setOtp(null)}
            onVerified={handleVerified}
            title={otp === "login" ? "Log in to Truth Estate" : "Save your brief"}
            subtitle={
              otp === "login"
                ? "Verify your number and we'll bring your saved requirements across."
                : "Verify once — your brief stays saved to you and follows you across every project."
            }
          />
        </>
      )}
    </section>
  );
}

/* The input sheet — bottom sheet on mobile, centred dialog on desktop. */
function MatchSheet({ open, project, market, seed, computed, existing, member, verified, onClose, onSave, onLogin, onSaveBrief }: {
  open: boolean; project: ProjectIntel; market: MarketContext; seed: Draft; computed: boolean; existing: BuyData | null;
  member: boolean; verified: Verified | null;
  onClose: () => void; onSave: (b: BuyData) => void; onLogin: () => void; onSaveBrief: () => void;
}) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Draft>(seed);
  const corridors = corridorChips(market);

  useEffect(() => {
    if (!open) return;
    setDraft(seed);
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { cancelAnimationFrame(id); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const toggle = (key: "configs" | "priorities", v: string, max = 99) =>
    setDraft((d) => {
      const has = d[key].includes(v);
      let next = has ? d[key].filter((x) => x !== v) : [...d[key], v];
      if (!has && next.length > max) next = next.slice(next.length - max);
      return { ...d, [key]: next };
    });

  // A corridor chip owns several underlying live strings; toggle them as a set.
  const toggleCorridor = (keys: string[]) =>
    setDraft((d) => {
      const on = keys.some((k) => d.locations.includes(k));
      const locations = on
        ? d.locations.filter((k) => !keys.includes(k))
        : [...d.locations, ...keys.filter((k) => !d.locations.includes(k))];
      return { ...d, locations };
    });

  const preview: BuyData = {
    ...emptyBuyData, ...(existing ?? {}),
    purchaseType: draft.persona === "investor" ? "Investment" : existing?.purchaseType && existing.purchaseType !== "Investment" ? existing.purchaseType : "First Home",
    budgetCr: draft.budgetCr,
    configs: draft.configs,
    locations: draft.locations,
    priorities: draft.priorities,
    exitYears: draft.persona === "investor" ? draft.exitYears : null,
    poi: draft.poi,
  };
  // Live preview via the same engine the card uses; the mock fallback set keeps the legacy score.
  const live = hasPreferences(preview)
    ? project.matchInput
      ? scoreMatch(project.matchInput, buyerFromBuyData(preview), market).pct
      : matchScoreFor(project, preview)
    : null;
  const liveMeta = live != null ? matchLabel(live) : null;

  function save() { onSave(preview); }

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-6">
      <div className={`absolute inset-0 bg-[#1a1206]/45 backdrop-blur-md transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div data-ms-sheet className={`relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-[#ece3d1] bg-white text-[#1a1a1a] shadow-[0_-30px_80px_-26px_rgba(60,42,10,0.30)] transition-all duration-300 md:max-h-[90vh] md:max-w-[480px] md:rounded-[20px] ${show ? "translate-y-0 opacity-100 md:scale-100" : "translate-y-full opacity-0 md:translate-y-0 md:scale-[0.97]"}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(154,122,46,0.55), transparent)" }} />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 px-7 pt-6">
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#9a7a2e]">Match Score</p>
            <h2 className="mt-1.5 font-serif text-[1.5rem] font-medium leading-[1.12] text-[#1a1a1a]">How well does {project.name} fit you?</h2>
          </div>
          {live != null && liveMeta ? (
            <div className="shrink-0 text-right">
              <p className={`font-mono text-[1.7rem] font-light leading-none ${toneClass[liveMeta.tone]}`}>{live}%</p>
              <p className={`mt-0.5 text-[0.62rem] font-medium ${toneClass[liveMeta.tone]}`}>{liveMeta.label}</p>
            </div>
          ) : (
            <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/5 hover:text-black/70">✕</button>
          )}
        </div>

        <div className="relative overflow-y-auto px-7 pb-7 pt-5">
          <Block label="You're buying to">
            <Chip on={draft.persona === "end-user"} onClick={() => setDraft((d) => ({ ...d, persona: "end-user", priorities: [] }))}>Live in it</Chip>
            <Chip on={draft.persona === "investor"} onClick={() => setDraft((d) => ({ ...d, persona: "investor", priorities: [] }))}>Invest</Chip>
          </Block>
          <Block label="Your budget">
            {BUDGETS.map((b) => <Chip key={b.cr} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>)}
          </Block>
          <Block label="Configuration">
            {CONFIG_CHIPS.map((c) => <Chip key={c} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>)}
          </Block>
          {(corridors.length > 0 || POI_ENABLED) && (
            <div className="mt-5">
              <p className="mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
                Preferred location<span className="ml-2 tracking-normal text-[#1a1a1a]/30">· optional</span>
              </p>
              <LocationSearch
                corridors={corridors}
                selectedLocations={draft.locations}
                poi={draft.poi}
                onToggleCorridor={toggleCorridor}
                onPoiChange={(poi) => setDraft((d) => ({ ...d, poi }))}
              />
            </div>
          )}
          {draft.persona === "investor" && (
            <Block label="Exit horizon" hint="when you'd sell">
              {EXIT_YEARS.map((y) => <Chip key={y} on={draft.exitYears === y} onClick={() => setDraft((d) => ({ ...d, exitYears: y }))}>{y} yrs</Chip>)}
            </Block>
          )}
          <Block label="What matters most" hint="up to 3">
            {PRIORITY_BY_PERSONA[draft.persona].map((p) => <Chip key={p} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>)}
          </Block>
          <button onClick={save} className="mt-6 w-full rounded-md bg-[#1e6b45] px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
            {computed ? "Update my fit" : "See my fit"}
          </button>
          <p className="mt-3 text-center text-[0.68rem] font-light text-black/35">Private to you · scores against your brief, never the brochure.</p>

          {/* Identity — confirm the save once verified, otherwise offer to save the
             brief to a profile (register) or pull an existing one (log in). */}
          {member && verified ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[0.62rem] tracking-[0.02em] text-[#1e6b45]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b45]" aria-hidden /> Saved to {maskContact(verified)}
            </p>
          ) : (
            <div className="mt-4 border-t border-black/[0.06] pt-3.5 text-center">
              <button onClick={onSaveBrief} className="text-[0.78rem] font-medium text-[#1e6b45] underline decoration-[#1e6b45]/30 underline-offset-2 transition-colors hover:decoration-[#1e6b45]">
                Save this brief to your profile
              </button>
              <p className="mt-2 text-[0.68rem] font-light text-black/40">
                Already with us?{" "}
                <button onClick={onLogin} className="font-medium text-[#9a7a2e] underline decoration-[#9a7a2e]/40 underline-offset-2 transition-colors hover:decoration-[#9a7a2e]">Log in</button>{" "}
                to pull your saved requirements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FitRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[0.88rem] font-light leading-[1.5] text-[#1a1a1a]/70">
      <span className={`mt-0.5 text-[0.9rem] ${ok ? "text-[#1e6b45]" : "text-[#b0503e]"}`}>{ok ? "✓" : "—"}</span>
      {label}
    </li>
  );
}

function Block({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
        {label}{hint && <span className="ml-2 tracking-normal text-[#1a1a1a]/30">· {hint}</span>}
      </p>
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-all ${on ? "border-[#1e6b45] bg-[#1e6b45]/10 text-[#1e6b45]" : "border-black/[0.14] text-[#1a1a1a]/60 hover:border-black/30 hover:text-[#1a1a1a]/85"}`}
    >
      {children}
    </button>
  );
}

type PlaceHit = { placeId: string; main: string; secondary: string };

function LocationSearch({ corridors, selectedLocations, poi, onToggleCorridor, onPoiChange }: {
  corridors: CorridorChip[];
  selectedLocations: string[];
  poi: { lat: number; lng: number; label: string } | null;
  onToggleCorridor: (keys: string[]) => void;
  onPoiChange: (poi: { lat: number; lng: number; label: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? corridors.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (filtered.length > 0 || query.trim().length < 3 || !GMAPS_KEY) {
      setPlaces([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GMAPS_KEY },
          body: JSON.stringify({
            input: query,
            locationBias: { circle: { center: { latitude: 28.45, longitude: 77.03 }, radius: 30000 } },
          }),
        });
        if (!res.ok) { setPlaces([]); return; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        setPlaces(
          (data.suggestions ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s: any) => s.placePrediction?.placeId)
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((s: any) => ({
              placeId: s.placePrediction.placeId,
              main: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? "",
              secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
            })),
        );
        setOpen(true);
      } catch { setPlaces([]); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, filtered.length]);

  const pickPlace = useCallback(async (hit: PlaceHit) => {
    setOpen(false);
    setQuery("");
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${hit.placeId}`,
        { headers: { "X-Goog-Api-Key": GMAPS_KEY, "X-Goog-FieldMask": "location" } },
      );
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (data.location) {
        onPoiChange({ lat: data.location.latitude, lng: data.location.longitude, label: hit.main });
      }
    } catch { /* silent */ }
  }, [onPoiChange]);

  const pickCorridor = (ch: CorridorChip) => {
    onToggleCorridor(ch.keys);
    setQuery("");
    setOpen(false);
  };

  const showDropdown = open && query.trim() && (filtered.length > 0 || places.length > 0);

  return (
    <div ref={wrapRef}>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder="Search area or landmark…"
          className="w-full rounded-full border border-black/[0.12] bg-white/80 py-2 pl-3.5 pr-8 text-[0.8rem] font-light outline-none placeholder:text-black/30 focus:border-[#1e6b45]"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setPlaces([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.7rem] text-black/30 hover:text-black/60"
            aria-label="Clear"
          >✕</button>
        )}
        {showDropdown && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-black/10 bg-white shadow-lg">
            {filtered.map((ch) => (
              <button
                key={ch.label}
                type="button"
                onClick={() => pickCorridor(ch)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-[#1e6b45]/[0.06]"
              >
                <span className="text-[0.8rem] font-light text-[#1a1a1a]/80">{ch.label}</span>
                {ch.keys.some((k) => selectedLocations.includes(k))
                  ? <span className="text-[0.72rem] font-light text-[#1e6b45]">✓</span>
                  : <span className="text-[0.72rem] font-light text-black/30">Add</span>}
              </button>
            ))}
            {places.map((h) => (
              <button
                key={h.placeId}
                type="button"
                onClick={() => pickPlace(h)}
                className="w-full px-3.5 py-2.5 text-left transition-colors hover:bg-[#1e6b45]/[0.06]"
              >
                <span className="block text-[0.8rem] font-light text-[#1a1a1a]/80">{h.main}</span>
                {h.secondary && <span className="block text-[0.68rem] font-light text-[#1a1a1a]/40">{h.secondary}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {corridors.length > 0 && (
        <div className="mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2">
            {corridors.map((ch) => {
              const on = ch.keys.some((k) => selectedLocations.includes(k));
              return (
                <button
                  key={ch.label}
                  type="button"
                  onClick={() => onToggleCorridor(ch.keys)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-all ${on ? "border-[#1e6b45] bg-[#1e6b45]/10 text-[#1e6b45]" : "border-black/[0.14] text-[#1a1a1a]/60 hover:border-black/30 hover:text-[#1a1a1a]/85"}`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {poi && (
        <div className="mt-2.5 flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9a7a2e] bg-[#9a7a2e]/10 py-1.5 pl-3.5 pr-2 text-[0.8rem] font-light text-[#9a7a2e]">
            {poi.label}
            <button
              type="button"
              onClick={() => onPoiChange(null)}
              aria-label={`Remove ${poi.label}`}
              className="grid h-4 w-4 place-items-center rounded-full text-[0.7rem] leading-none text-[#9a7a2e]/70 transition-colors hover:bg-[#9a7a2e]/15 hover:text-[#9a7a2e]"
            >✕</button>
          </span>
        </div>
      )}
    </div>
  );
}
