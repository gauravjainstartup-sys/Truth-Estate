"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import { loadBuyData, hasPreferences, deriveDNA, clearAllDemoData, saveLead, hasReadAccess, has3DAccess } from "@/lib/journey";
import type { ConsultProfileChip } from "@/lib/consultation";
import { TAG_CHIP } from "@/lib/heroSearch";
import type { ScoreTag } from "@/lib/omni";
import {
  fmtPsf,
  developerOf,
  marketOf,
  roiModel,
  investorFit,
  projectFaqs,
  towerIntelMeta,
  rankContext,
  reviewedOn,
  type ProjectIntel,
} from "@/lib/projects";
import { useLiveVitals } from "@/lib/useLiveVitals";
import MatchScore from "./MatchScore";
import TowerIntel, { openUnitIntel } from "./TowerIntel";
import UnlockModal from "./UnlockModal";
import LockedReport from "./LockedReport";
import UnlockDesk from "./UnlockDesk";
import ChallengeChat from "./ChallengeChat";
import ReportAnatomy from "./ReportAnatomy";
import ReportDeveloper from "./ReportDeveloper";
import ReportConstruction from "./ReportConstruction";
import ReportLegal from "./ReportLegal";
import ReportLocation from "./ReportLocation";
import SearchPalette from "./SearchPalette";
import ZoomStage from "./ZoomStage";
import PdfScroller from "./PdfScroller";
import PdfThumb from "./PdfThumb";
import ReportUSPs from "./ReportUSPs";
import ReportPrice from "./ReportPrice";
import ReportVerdict from "./ReportVerdict";
import ReportExplore from "./ReportExplore";
import ReportFeedback from "./ReportFeedback";
import ReportHomes from "./ReportHomes";

const basePath = "/Truth-Estate";

/* media paths are repo-relative for the flagship files; pipeline rows may
   carry absolute (storage) URLs — pass those through untouched */
const asset = (s: string) => (/^(https?:\/\/|data:)/i.test(s) ? s : `${basePath}/${s}`);

/* The "sample read" watermark text — repeated so the oversized rotated layer
   tiles it diagonally across the whole dummy report (a pure-DOM watermark:
   Chromium doesn't render SVG <text> when the SVG is a CSS background-image,
   so DOM text is the reliable path). */
const SAMPLE_WATERMARK_TEXT = Array.from({ length: 400 }, () => "SAMPLE READ").join(" · ");

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

/* Vitals, part 1 — a money fact: the value leads big in the site sans
   (Geist) so the figures read as clean data, not calligraphy; the label
   whispers underneath. */
function Money({ v, k }: { v: string; k: string }) {
  // adaptive display type — long values step down so no fact dominates the row
  const size = v.length > 24 ? "text-[1.15rem] md:text-[1.35rem]" : v.length > 17 ? "text-[1.35rem] md:text-[1.6rem]" : "text-[1.6rem] md:text-[1.95rem]";
  return (
    <div>
      <p className={`${size} font-normal leading-[1.18] tracking-[-0.02em] tabular-nums ${v.length <= 10 ? "whitespace-nowrap" : "text-balance"}`}>{v}</p>
      <p className="mt-1.5 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/35">{k}</p>
    </div>
  );
}

/* Vitals, part 2 — a registry row: label · dotted leader · value. Small icon
   on the label (the Sobha-style detail list), link affordance on the value. */
function Reg({ k, v, tag, href, icon }: { k: string; v: string; tag?: string; href?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-baseline py-[0.72rem]">
      {icon && <span aria-hidden className="mr-2.5 self-center text-[#9a7a2e]">{icon}</span>}
      <span className="shrink-0 text-[0.85rem] font-light text-[#1a1a1a]/60">{k}</span>
      <span aria-hidden className="mx-3 flex-1 -translate-y-[3px] border-b border-dotted border-[#1a1a1a]/25" />
      <span className="shrink-0 text-right font-mono text-[0.85rem] font-medium text-[#1a1a1a]/85">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#1e6b45]">
            {v}<IconArrowUpRight className="ml-1 text-[#9a7a2e]" />
          </a>
        ) : v}
        {tag && <span className="ml-2 rounded bg-[#1e6b45]/8 px-1.5 py-0.5 font-sans text-[0.56rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">{tag}</span>}
      </span>
    </div>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">{children}</p>;
}

/* A document slot with nothing on file — same card silhouette as a real
   document, honest "not on file yet" cover, per-document request CTA that
   captures a lead (one contact field, doc type implicit). */
function DocSlot({ project, title, sub }: { project: string; title: string; sub: string }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/50 ${sent ? "border-[#1e6b45]/30" : "border-dashed border-[#9a7a2e]/40"}`}>
      <div className="relative aspect-[16/10] bg-[#f5f0e5]/70">
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9a7a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-8 w-8 opacity-70" aria-hidden>
              <path d="M6 2.5h8L19.5 8v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" /><path d="M14 2.5V8h5.5M9 13h6M9 17h6" />
            </svg>
            <p className="mt-2.5 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]/80">{sent ? "Requested" : "Not on file yet"}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        {sent ? (
          <p className="text-[0.8rem] font-medium leading-[1.5] text-[#1e6b45]">✓ Requested — the desk sources it and sends it to you, usually the same day.</p>
        ) : open ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveLead({ name: "", email: contact, project, intent: "documents", docs: [title], createdAt: Date.now() });
              setSent(true);
            }}
            className="flex gap-2"
          >
            <input
              required autoFocus value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="Phone / WhatsApp / email"
              className="w-full min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/12 bg-white px-3 py-2.5 text-[0.78rem] outline-none transition-colors focus:border-[#1e6b45]"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-[#1e6b45] px-3.5 py-2.5 text-[0.76rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Send →</button>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} className="group flex w-full items-center justify-between gap-4 text-left">
            <span>
              <span className="block text-[0.92rem] font-semibold text-[#1a1a1a]/85">{title}</span>
              <span className="mt-0.5 block text-[0.7rem] font-light text-[#1a1a1a]/45">{sub}</span>
            </span>
            <span className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors group-hover:text-[#7a5f1e]">Request →</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* Compact ₹-thousands: 18500 → "18.5", 21000 → "21". */
function kpsf(n: number): string {
  return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, "");
}

function ticketFromPsf(currentLow: number, sizeBand: string | null): [number, number] | null {
  if (!sizeBand) return null;
  const nums = sizeBand.replace(/,/g, "").match(/\d+/g);
  if (!nums || nums.length < 2) return null;
  const lo = Math.round((currentLow * Number(nums[0])) / 1e6) / 10;
  const hi = Math.round((currentLow * Number(nums[1])) / 1e6) / 10;
  return lo > 0 && hi > 0 ? [lo, hi] : null;
}

/* Low/Mid/High-rise from the top of the floors band ("34–38" → 38). */
function riseTypeOf(floors: string): string | null {
  const nums = floors.match(/\d+/g);
  if (!nums?.length) return null;
  const top = Math.max(...nums.map(Number));
  return top <= 4 ? "Low-rise" : top <= 10 ? "Mid-rise" : "High-rise";
}

/* Tiny line icons for the vitals labels — same 24×24 / 1.7-stroke family
   as the hero set, rendered at label size. */
const VI = "h-[0.92rem] w-[0.92rem]";
const vi = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const VITAL_ICON = {
  ticket: <svg {...vi} className={VI} aria-hidden><rect x="2.5" y="6.5" width="19" height="11" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 10v4M18 10v4" /></svg>,
  configs: <svg {...vi} className={VI} aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M12 3.5V14M3.5 14h17M12 9h8.5" /></svg>,
  psf: <svg {...vi} className={VI} aria-hidden><path d="M3.5 19.5h17" /><path d="M4.5 15.5 10 10l3.5 3.5 6-6.5" /><path d="M15 6.5h4.5V11" /></svg>,
  tag: <svg {...vi} className={VI} aria-hidden><path d="M3.5 11.5v-8h8L20.5 12.5 12.5 20.5 3.5 11.5Z" /><circle cx="8" cy="8" r="1.4" /></svg>,
  size: <svg {...vi} className={VI} aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M8.5 15.5v-7h7M8.5 8.5 15 15" /></svg>,
  units: <svg {...vi} className={VI} aria-hidden><rect x="3.5" y="12.5" width="8" height="8" rx="1" /><rect x="12.5" y="12.5" width="8" height="8" rx="1" /><rect x="8" y="3.5" width="8" height="8" rx="1" /></svg>,
  towers: <svg {...vi} className={VI} aria-hidden><path d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h4A1.5 1.5 0 0 1 11 6.5V21" /><path d="M13 21V3.5A1.5 1.5 0 0 1 14.5 2h4A1.5 1.5 0 0 1 20 3.5V21M2.5 21h19" /></svg>,
  land: <svg {...vi} className={VI} aria-hidden><path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" /><path d="M9 4.5v13M15 6.5v13" /></svg>,
  floors: <svg {...vi} className={VI} aria-hidden><path d="M12 3 21 7.5 12 12 3 7.5 12 3Z" /><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" /></svg>,
  rise: <svg {...vi} className={VI} aria-hidden><path d="M5 21V11l5-3v13M10 21V13.5l5-3V21M15 21V8.5l4.5-2.5V21M3 21h18" /></svg>,
  density: <svg {...vi} className={VI} aria-hidden><circle cx="7" cy="7" r="2" /><circle cx="17" cy="7" r="2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>,
  leaf: <svg {...vi} className={VI} aria-hidden><path d="M5 19C5 9 12 4.5 20 4c.5 8-4 15-15 15Z" /><path d="M5 19c3-5 7-8.5 11-10.5" /></svg>,
  calendar: <svg {...vi} className={VI} aria-hidden><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 2.8V6M16 2.8V6" /></svg>,
  key: <svg {...vi} className={VI} aria-hidden><circle cx="8" cy="8" r="4.5" /><path d="m11.2 11.2 8.3 8.3M16 16.5l2.3-2.3M18.7 19.2l2-2" /></svg>,
  file: <svg {...vi} className={VI} aria-hidden><path d="M6 2.5h8L19.5 8v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" /><path d="M14 2.5V8h5.5M9 13h6M9 17h6" /></svg>,
} as const;

/* The hero meta wants one token — the ENTRY BHK with a "+" when the project
   offers more configurations, mirroring the "from ₹X Cr+" ticket beside it:
   "3 · 4 BHK · Penthouse" → "3 BHK+" (starts at 3 BHK, larger also on offer). */
function configsCompact(list: string[]): string {
  const nums = list.map((c) => parseFloat(c)).filter((n) => !Number.isNaN(n));
  if (!nums.length) return list[0] ?? "";
  return `${Math.min(...nums)} BHK${list.length > 1 ? "+" : ""}`;
}

/* The Configs vital wants ONE scannable value, however many configurations a
   project offers — a BHK span (mirroring the Super-area range beside it) plus
   any distinct special types. The exact per-config breakdown lives in Homes.
   "3.5 BHK · 4.5 BHK · 4 BHK Duplex Penthouse · 5 BHK Duplex Penthouse"
     → "3.5–5 BHK · Duplex Penthouse". */
function configsDisplay(list: string[]): string {
  if (!list.length) return "—";
  const nums: number[] = [];
  const extras: string[] = []; // "Duplex Penthouse" etc., or a whole non-BHK label
  for (const c of list) {
    const m = c.match(/^\s*(\d+(?:\.\d+)?)\s*BHK\b\s*(.*)$/i);
    if (m) { nums.push(parseFloat(m[1])); const t = m[2].trim(); if (t) extras.push(t); }
    else { const t = c.trim(); if (t) extras.push(t); }
  }
  const parts: string[] = [];
  if (nums.length) {
    const lo = Math.min(...nums), hi = Math.max(...nums);
    parts.push(lo === hi ? `${lo} BHK` : `${lo}–${hi} BHK`);
  }
  for (const e of extras) if (!parts.includes(e)) parts.push(e); // dedupe, keep order
  return parts.join(" · ") || "—";
}

export default function ProjectProfile({
  p,
  embedded = false,
  sample = false,
  onClose,
  onBack,
  onConsult,
  onChallenge,
  onSelectAlternative,
}: {
  p: ProjectIntel;
  /* When rendered inside the journey modal: drop the page chrome, keep the
     reader in the flow, and route actions back to the journey. */
  embedded?: boolean;
  /* The watermarked sample read — never paywalled. */
  sample?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onConsult?: () => void;
  onChallenge?: () => void;
  onSelectAlternative?: (name: string) => void;
}) {
  const { openConsult } = useConsultation();
  const router = useRouter();
  // ── Paywall (north metric: paid customers). Reads are paid: a guest sees the
  // free chapters (fundamentals + score anatomy); everything from Chapter II ·
  // Pillar I (Developer DNA) down is masked until they register and buy a read.
  // The watermarked sample read is never locked. Access is re-checked client-
  // side on mount, so a paid reader unmasks after prerender (backend-verified
  // for real later; the demo session resets on hard refresh by design).
  const [readAccess, setReadAccess] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockFocus3D, setUnlockFocus3D] = useState(false);
  const [threeDAccess, setThreeDAccess] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  useEffect(() => { setReadAccess(hasReadAccess(p.slug)); setThreeDAccess(has3DAccess(p.slug)); }, [p.slug]);
  const live = useLiveVitals(p.name);
  const locked = !sample && !readAccess;
  const SAMPLE_HREF = `${basePath}/intelligence/projects/sample-read`;
  const lockedTicket = p.budget[0] === p.budget[1] ? (p.budget[0] ? `₹${p.budget[0]} Cr+` : "") : `₹${p.budget[0]}–${p.budget[1]} Cr`;
  // "Get Independent Advice" from a report is about THIS project — open the
  // consultation with the project as its source (the advisor preps for it),
  // and if the visitor already shared a brief (Match Score / Buyer Office),
  // pass it as a warm profile so we never re-ask what we know.
  const consult = onConsult ?? (() => {
    const saved = loadBuyData();
    let profile: ConsultProfileChip[] | undefined;
    if (saved && hasPreferences(saved)) {
      const dna = deriveDNA(saved);
      profile = [
        { label: "Budget", value: dna.budgetRange },
        { label: "Markets", value: dna.markets.slice(0, 3).join(", ") },
        { label: "Timeline", value: dna.timeline },
        ...(saved.priorities.length ? [{ label: "Priorities", value: saved.priorities.join(", ") }] : []),
      ];
    }
    openConsult({ source: p.name, sourceKind: "project", ...(profile ? { intent: "buy" as const, profile } : {}) });
  });
  // standalone project pages open the project-scoped, paywall-aware chat;
  // embedded (the shortlist workspace) keeps its in-journey truthguide step.
  const challenge = onChallenge ?? (() => setChallengeOpen(true));

  // The page's primary CTA swaps by lock state: a locked read leads with the
  // sale ("Get Full Read" → unlock modal); once unlocked it leads with the
  // free advisor call.
  const primaryCta = locked
    ? { label: "Get Full Read", onClick: () => setUnlockOpen(true) }
    : { label: "Get Independent Advice", onClick: consult };

  const dev = developerOf(p);
  const market = marketOf(p);
  // Pillar III mounts for a curated market dossier OR live location data —
  // the live radar/POI section is fully self-contained (ReportLocation
  // reads none of the static market fields)
  const locIntel = !!market || !!p.ops?.location;
  const roi = roiModel(p);
  const faqs = projectFaqs(p);
  const ops = p.ops;
  const usps = ops?.usps ?? [];
  const ctx = rankContext(p);
  const reviewed = reviewedOn(p);
  const mapHref = ops?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${ops.address}`)}` : undefined;
  const buildStatus = ops?.construction
    ? `Mid-construction · ${ops.construction.actualPct}% built`
    : ops?.possession
    ? `Under construction · handover ${ops.possession}`
    : undefined;
  const heroImage = ops?.media?.heroImage;
  const has3D = !!towerIntelMeta(p)?.file;

  const con = ops?.construction;

  // The free chapters a guest always sees; when locked, every other section
  // collapses to a single "Unlock full read" jump.
  const FREE_IDS = new Set(["match", "vitals", "masterplan", "homes", "tower-intel", "documents", "anatomy"]);
  const toc = [
    { id: "match", label: "Match score", show: true },
    { id: "vitals", label: "Vitals", show: true },
    { id: "masterplan", label: "Masterplan", show: !!ops?.media?.masterplan },
    { id: "homes", label: "Homes & floor plans", show: (ops?.homes?.length ?? 0) > 0 },
    { id: "tower-intel", label: "Sun & Vastu 3D", show: true },
    { id: "documents", label: "Brochure & payment plan", show: true },
    { id: "anatomy", label: "Truth Score anatomy", show: true },
    { id: "developer", label: "Developer DNA", show: !!dev },
    { id: "construction", label: "Construction & sales", show: !!con },
    { id: "location", label: "Location intelligence", show: locIntel },
    { id: "legal", label: "Legal & compliance", show: true },
    { id: "usps", label: "Project USPs", show: usps.length > 0 },
    { id: "roi", label: "Price & returns", show: !!roi },
    { id: "verdict", label: "The verdict", show: true },
    { id: "strengths", label: "Strengths & watch-outs", show: p.strengths.length > 0 || p.watchouts.length > 0 },
    { id: "faqs", label: "Straight answers", show: faqs.length > 0 },
  ]
    .filter((t) => t.show && (!locked || FREE_IDS.has(t.id)))
    .concat(locked ? [{ id: "unlock", label: "Unlock full read", show: true }] : []);

  /* Sequential section numbers — only counts sections that actually render,
     so hidden modules never leave a gap in the sequence. */
  let _n = 0;
  const num = () => String(++_n).padStart(2, "0");

  /* Horizontal, swipeable section index with scroll-spy. Appears only once
     the reader scrolls past the hero (Apple local-nav pattern) — an overlay,
     so showing/hiding never shifts the page. */
  const tocKey = toc.map((t) => t.id).join(",");
  const [active, setActive] = useState<string>("");
  const [showStrip, setShowStrip] = useState(false);
  const [hideHdr, setHideHdr] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", time: "" });
  // document viewer (masterplan / brochure pages / payment plan)
  const [doc, setDoc] = useState<{ title: string; pages: string[]; idx: number } | { title: string; pdf: string } | null>(null);
  useEffect(() => {
    if (!doc) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDoc(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [doc]);
  const scheduleCall = (e: FormEvent) => { e.preventDefault(); setScheduled(true); };
  const stripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (embedded) return;
    const firstId = tocKey.split(",")[0];
    let raf = 0;
    let lastY = window.scrollY;
    const check = () => {
      raf = 0;
      const el = document.getElementById(firstId);
      const past = el ? el.getBoundingClientRect().top <= 140 : window.scrollY > 480;
      setShowStrip(past);
      // direction-aware chrome: scrolling down tucks the header away, scrolling
      // up brings it back. On the mobile overlay header, while the hero still
      // owns the screen we keep it tucked — otherwise a scroll-up to the top
      // slides it down over the project name (the "stuck at the title" bug).
      const y = window.scrollY;
      const d = y - lastY;
      if (Math.abs(d) > 2) {
        const overlay = window.innerWidth < 640;
        setHideHdr(overlay && !past ? true : d > 0 && y > 24);
        lastY = y;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [embedded, tocKey]);
  // Mobile: tuck the header on first paint so the hero owns the full first
  // screen. The direction-aware scroll logic above brings it back on the
  // first upward scroll (and hides it again on the way down).
  useEffect(() => {
    if (embedded || typeof window === "undefined") return;
    // below sm the hero bleeds edge-to-edge and the header is a fixed overlay,
    // so start hidden — the hero owns the top of the screen (matches the sm
    // breakpoint where the header switches back to sticky and reserves space).
    if (window.matchMedia("(max-width: 639px)").matches) setHideHdr(true);
  }, [embedded]);
  const jumpTo = (id: string) => {
    setActive(id);
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 132, behavior: "smooth" });
  };
  useEffect(() => {
    if (embedded) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    tocKey.split(",").forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [embedded, tocKey]);
  useEffect(() => {
    const strip = stripRef.current;
    if (!active || !strip) return;
    const chip = strip.querySelector(`[data-chip="${active}"]`) as HTMLElement | null;
    if (chip) strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className={`${embedded ? "h-full overflow-y-auto" : "min-h-svh"} bg-[#F5F0E8] text-[#1a1a1a]`}>
      {/* Standalone mobile: the header is a fixed OVERLAY (out of flow) so the
         hero bleeds to the very top of the viewport — hiding it leaves no gap,
         it just isn't there until a scroll-up slides it in over the hero.
         Desktop stays sticky (reserves its space); the journey modal stays
         sticky too (a fixed header would escape the modal's own scroll). */}
      <header className={`${embedded ? "sticky" : "fixed inset-x-0 sm:sticky"} top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm transition-transform duration-200 ease-out ${hideHdr ? "-translate-y-full" : "translate-y-0"}`}>
        <div className={`mx-auto flex ${embedded ? "max-w-6xl" : "max-w-7xl"} items-center gap-4 px-6 py-4 md:px-10`}>
          {embedded ? (
            <>
              <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
              <div className="ml-auto flex items-center gap-5 md:gap-6">
                <button onClick={primaryCta.onClick} className="hidden rounded-sm bg-[#1e6b45] px-4 py-2 text-[0.72rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:inline-block">
                  {primaryCta.label}
                </button>
                <button onClick={onClose} aria-label="Close" className="text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]">
                  CLOSE
                </button>
              </div>
            </>
          ) : (
            <>
              <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
              <SearchPalette className="ml-auto" />
              <button onClick={primaryCta.onClick} className="hidden rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:inline-block md:px-5">
                {primaryCta.label}
              </button>
              {/* Mobile: a BACK affordance mirroring the embedded CLOSE — same
                 quiet treatment, right-aligned. Returns to wherever the reader
                 came from (journey, shortlist, another report, or the site). */}
              <button onClick={() => router.back()} aria-label="Back" className="inline-flex items-center gap-1.5 text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a] md:hidden">
                <span aria-hidden="true" className="text-[13px] leading-none">←</span> BACK
              </button>
            </>
          )}
        </div>
        {!embedded && (
          <nav aria-label="Report sections" aria-hidden={!showStrip}
            className={`absolute inset-x-0 top-full border-b border-[#1a1a1a]/8 bg-[#F5F0E8]/95 shadow-[0_8px_24px_-18px_rgba(26,26,26,0.35)] backdrop-blur-sm transition-all duration-300 ease-out ${showStrip ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`}>
            <div className="relative mx-auto max-w-7xl px-6 md:px-10">
              <div ref={stripRef} className="flex gap-1 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`} data-chip={t.id} onClick={(e) => { e.preventDefault(); jumpTo(t.id); }}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.75rem] transition-colors ${active === t.id ? "bg-[#1a1a1a] font-medium text-white" : "text-[#1a1a1a]/50 hover:bg-[#1a1a1a]/[0.06] hover:text-[#1a1a1a]"}`}>
                    {t.label}
                  </a>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#F5F0E8] to-transparent md:right-10" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F5F0E8] to-transparent md:left-10" />
            </div>
          </nav>
        )}
      </header>

      <div className={`mx-auto ${embedded ? "max-w-6xl pt-[6vh]" : "max-w-7xl pt-4 md:pt-7"} px-6 pb-[12vh] md:px-10`}>
        <div className={embedded ? "" : "xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14"}>
          {/* The Independent Desk — a calm, constant companion, not a sales column.
              The report does the persuading; this holds one human way to get help.
              Advice is the product; the deep layer is one quiet line, not a billboard. */}
          {!embedded && (
            <aside className="hidden self-start xl:col-start-2 xl:row-start-2 xl:sticky xl:top-[132px] xl:block">
              {locked ? (
                <UnlockDesk onUnlock={() => setUnlockOpen(true)} sampleHref={SAMPLE_HREF} />
              ) : (
              <>
              <div className="rounded-2xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6">
                <div className="flex items-center gap-3">
                  {/* the human is the seal — the real founder, not a badge */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain — Founder, Truth Estate" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#B29668]/50" />
                  <div className="min-w-0">
                    <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]">The Independent Desk</p>
                    <p className="mt-0.5 text-[0.82rem] font-semibold leading-tight text-[#1a1a1a]">Gaurav Jain</p>
                    <p className="truncate text-[0.64rem] font-light text-[#1a1a1a]/45">Founder, Truth Estate</p>
                  </div>
                </div>

                <p className="mt-4 font-serif text-[1.32rem] font-medium leading-[1.24] text-[#1a1a1a]">Talk to someone who has actually read this file.</p>

                {scheduled ? (
                  <div className="mt-4 rounded-xl border border-[#1e6b45]/20 bg-[#1e6b45]/[0.06] px-4 py-3.5 text-[0.8rem] font-medium leading-[1.55] text-[#1e6b45]">✓ Thanks{lead.name ? `, ${lead.name.trim().split(" ")[0]}` : ""} — an advisor will call you{lead.time ? ` ${lead.time.toLowerCase()}` : " shortly"}. Expect a Gurugram number.</div>
                ) : formOpen ? (
                  <form onSubmit={scheduleCall} className="mt-4 space-y-2">
                    <input required value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Your name" className="w-full rounded-lg border border-[#1a1a1a]/12 bg-white px-3.5 py-2.5 text-[0.8rem] outline-none transition-colors focus:border-[#1e6b45]" />
                    <input required type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="Phone / WhatsApp" className="w-full rounded-lg border border-[#1a1a1a]/12 bg-white px-3.5 py-2.5 text-[0.8rem] outline-none transition-colors focus:border-[#1e6b45]" />
                    <select required value={lead.time} onChange={(e) => setLead({ ...lead, time: e.target.value })} className="w-full rounded-lg border border-[#1a1a1a]/12 bg-white px-3.5 py-2.5 text-[0.8rem] text-[#1a1a1a]/80 outline-none transition-colors focus:border-[#1e6b45]">
                      <option value="" disabled>Preferred time</option>
                      <option>Today · morning</option><option>Today · evening</option><option>Tomorrow</option><option>This weekend</option>
                    </select>
                    <button type="submit" className="w-full rounded-lg bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Confirm the callback</button>
                  </form>
                ) : (
                  <div className="mt-5">
                    <button onClick={() => setFormOpen(true)} className="group flex w-full items-center justify-between rounded-xl bg-[#1e6b45] px-5 py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#238c55]">
                      Book a 15-minute call <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                    <button onClick={consult} className="mt-2.5 w-full text-center text-[0.72rem] font-medium text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80">or ask a question first</button>
                  </div>
                )}

                <p className="mt-5 border-t border-[#1a1a1a]/8 pt-3.5 text-[0.64rem] font-light leading-[1.5] text-[#1a1a1a]/40">Every file crosses the founder&apos;s desk before it ships. Independent — no inventory, no builder commission.</p>
              </div>

              {/* one quiet way to explore the product first — a line, not a billboard */}
              <button onClick={() => jumpTo("tower-intel")} className="group mt-4 flex w-full items-center gap-2.5 px-1 text-left text-[0.72rem] font-light text-[#1a1a1a]/50 transition-colors hover:text-[#1a1a1a]/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[#9a7a2e]" aria-hidden><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>
                Rather explore first? <span className="font-medium text-[#1a1a1a]/75 group-hover:text-[#1e6b45]">Walk the Sun &amp; Vastu 3D →</span>
              </button>
              </>
              )}
            </aside>
          )}

          <div className="min-w-0 xl:col-span-2 xl:col-start-1 xl:row-start-1">
            {/* Back to shortlist (embedded only). The public breadcrumb lives
               inside the hero canvas — SEO is carried by the BreadcrumbList
               JSON-LD in the page head, so no standalone band up here. */}
            {embedded && (
              <button onClick={onBack} className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80">
                <span aria-hidden>&larr;</span> Back to shortlist
              </button>
            )}

            {/* Hero canvas — one layout, two backgrounds: the site aerial when we
                hold one, a designed dark panel when we don't. Same light overlay.
                On phones the standalone hero bleeds edge-to-edge (cancelling the
                page gutters) and keeps only its curved base — the "sheet peel". */}
              <div className={`relative ${embedded ? "mt-9 rounded-[24px]" : "-mx-6 -mt-4 rounded-b-[26px] sm:mx-0 sm:mt-0 sm:rounded-[24px]"} overflow-hidden bg-[#0b1f1a] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]`}>
                {heroImage ? (
                  <>
                    <img src={asset(heroImage)} alt={`${p.name} — aerial site view`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 42%" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,12,18,0.94) 0%, rgba(8,12,18,0.66) 30%, rgba(8,12,18,0.22) 62%, rgba(8,12,18,0.26) 100%)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,12,18,0.5), rgba(8,12,18,0) 60%)" }} />
                    {/* stacked layouts carry the identity at the top — darken the
                       canvas head so name & address stay legible over bright sites */}
                    <div className="absolute inset-0 xl:hidden" style={{ background: "linear-gradient(to bottom, rgba(8,12,18,0.8) 0%, rgba(8,12,18,0.5) 20%, rgba(8,12,18,0) 44%)" }} />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0" style={{ background: "radial-gradient(125% 115% at 82% 8%, #123d2e 0%, #0b1f1a 46%, #061510 100%)" }} />
                    <div className="absolute inset-0 opacity-90" style={{ background: "radial-gradient(54% 74% at 6% 108%, rgba(34,140,85,0.16), transparent 72%)" }} />
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.85) 0.6px, transparent 0.7px)", backgroundSize: "24px 24px" }} />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(178,150,104,0.55), transparent)" }} />
                  </>
                )}
                <div className="relative flex min-h-[700px] flex-col p-6 sm:min-h-[600px] sm:p-7 md:p-11">
                  {/* breadcrumb folded into the canvas — hidden on phones to give the
                     visual more room; the SEO signal is the BreadcrumbList JSON-LD in
                     the head either way. */}
                  {!embedded && (
                    <nav aria-label="Breadcrumb" className="z-10 hidden min-w-0 items-center gap-2 pb-6 text-[0.72rem] font-light text-white/40 sm:flex">
                      <a href={`${basePath}/intelligence/projects`} className="shrink-0 transition-colors hover:text-white/85">Projects</a>
                      <span aria-hidden className="text-white/20">/</span>
                      <span className="min-w-0 truncate text-white/60">{p.name}</span>
                    </nav>
                  )}
                  {/* stacked layouts: identity opens the canvas top, the score group
                     anchors the base, satellite breathing in between. xl keeps the
                     side-by-side bottom-aligned composition. */}
                  <div className="flex flex-1 flex-col xl:flex-row xl:flex-wrap xl:items-end xl:justify-between xl:gap-x-10 xl:gap-y-7">
                    <div className="max-w-2xl">
                      <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-[#d8b978] md:block">Project Intelligence</p>
                      <h1 className={`mt-4 text-balance font-serif font-medium leading-[1.04] tracking-[-0.02em] text-[#F7F3EA] ${p.name.length > 24 ? "text-[2.15rem] md:text-[3.1rem]" : "text-[2.7rem] md:text-[3.9rem]"}`}>{p.name}</h1>
                      {ops?.address && (
                        <p className="mt-4 flex items-center text-[0.78rem] font-light text-white/70 sm:text-[0.9rem]">
                          <IconPin className="mr-2 text-[#d8b978]" />
                          {mapHref ? <a href={mapHref} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">{ops.address}<IconArrowUpRight className="ml-1 text-[#d8b978]" /></a> : ops.address}
                        </p>
                      )}
                      {/* the developer brand already leads the project name — no by-line;
                         top config + ticket, each with its glyph */}
                      <p className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.86rem] font-light text-white/60">
                        <span className="inline-flex items-center gap-2"><IconBed className="text-[#d8b978]" />{configsCompact(p.configs)}</span>
                        <span className="inline-flex items-center gap-2"><IconTag className="text-[#d8b978]" />{p.budget[0] === p.budget[1] ? (p.budget[0] ? `₹${p.budget[0]} Cr+` : "Price NA") : <>₹{p.budget[0]}–{p.budget[1]} Cr</>}</span>
                      </p>
                      {/* credential chips — on xl they stay with the identity column;
                         on stacked layouts they move down with the score group */}
                      <div className="mt-6 hidden items-center gap-2 xl:flex xl:flex-wrap">
                        {has3D && (
                          <button type="button" onClick={openUnitIntel} aria-label="Open the 3D Sun & Vastu advisor"
                            className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8b978]/45 bg-[#d8b978]/[0.15] px-3.5 py-1.5 text-[0.7rem] font-medium text-[#f4e9cd] backdrop-blur-sm transition-colors hover:bg-[#d8b978]/25">
                            <IconCube className="text-[#f0d492]" />Sun &amp; Vastu
                            <span aria-hidden className="inline-block text-[#f0d492] transition-transform group-hover:translate-x-0.5">↗</span>
                          </button>
                        )}
                        {ctx.corridorRank > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-medium text-white/85 backdrop-blur-sm">
                          <IconAward className="text-[#d8b978]" /> #{ctx.corridorRank} of {ctx.corridorCount} in {p.marketShort}
                        </span>
                        )}
                        {buildStatus && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/12 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-light text-white/70 backdrop-blur-sm">
                            <IconBuilding className="text-[#d8b978]" />{buildStatus}
                          </span>
                        )}
                      </div>
                      {/* caption in the left column on wide screens only — it's what
                         the score card bottom-aligns to when the two sit side-by-side */}
                      <p className="mt-6 hidden items-center gap-2 text-[0.62rem] font-light text-white/45 xl:flex">
                        <IconClock /> {heroImage ? "Satellite view of the site · construction as last observed" : "Independent assessment · re-scored quarterly"} · data reviewed {reviewed}
                      </p>
                    </div>
                    {/* stacked bottom group — the chips, the score card and the
                       one-line provenance gather at the base of the canvas */}
                    <div className="mt-auto w-full xl:mt-0 xl:w-auto">
                    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:hidden">
                      {has3D && (
                        <button type="button" onClick={openUnitIntel} aria-label="Open the 3D Sun & Vastu advisor"
                          className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8b978]/45 bg-[#d8b978]/[0.15] px-3.5 py-1.5 text-[0.7rem] font-medium text-[#f4e9cd] backdrop-blur-sm transition-colors hover:bg-[#d8b978]/25">
                          <IconCube className="text-[#f0d492]" />Sun &amp; Vastu
                          <span aria-hidden className="inline-block text-[#f0d492] transition-transform group-hover:translate-x-0.5">↗</span>
                        </button>
                      )}
                      {ctx.corridorRank > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-medium text-white/85 backdrop-blur-sm">
                        <IconAward className="text-[#d8b978]" /> #{ctx.corridorRank} of {ctx.corridorCount} in {p.marketShort}
                      </span>
                      )}
                      {buildStatus && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/12 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-light text-white/70 backdrop-blur-sm">
                          <IconBuilding className="text-[#d8b978]" />{buildStatus}
                        </span>
                      )}
                    </div>
                    {/* Truth Score — light readout card floated on the canvas */}
                    <div className="w-full max-w-[300px] rounded-2xl border border-white/20 bg-[#FBF8F2]/95 p-4 shadow-[0_22px_55px_-18px_rgba(0,0,0,0.6)] backdrop-blur-md sm:w-[290px] sm:p-5">
                      <p className="text-[0.5rem] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/40">Truth Score</p>
                      <p className="mt-1 flex items-baseline">
                        <span className="font-serif text-[3.2rem] font-normal leading-[0.82] text-[#1e6b45]">{p.truthScore}</span>
                        <span className="ml-1.5 font-mono text-[0.95rem] text-[#1a1a1a]/30">/100</span>
                      </p>
                      <p className="mt-2">
                        {/* the score's grade as the canonical band pill — same
                           treatment as the search-result cards (band-coloured) */}
                        <ScoreGradePill score={p.truthScore} />
                      </p>
                      <div className="mt-2.5 flex w-full gap-[3px]">
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <span key={idx} className={`h-[8px] flex-1 rounded-[2px] ${idx < Math.round(p.truthScore / 10) ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/[0.1]"}`} />
                        ))}
                      </div>
                      <div className="mt-3 border-t border-[#1a1a1a]/8 pt-2.5">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-[#1a1a1a]/60 sm:hidden">
                          {ctx.delta > 0 && <><span><b className="font-semibold text-[#1a1a1a]">+{ctx.delta}</b> vs {p.marketShort}</span><span className="text-[#1a1a1a]/25">·</span></>}
                          {ctx.rank > 0 && <><span>{ctx.bottomHalf ? <><b className="font-semibold text-[#1a1a1a]">Ranks {ctx.rank}/{ctx.total}</b> tracked</> : <><b className="font-semibold text-[#1a1a1a]">Top {ctx.topPct}%</b> tracked</>}</span><span className="text-[#1a1a1a]/25">·</span></>}
                          <span><b className="font-semibold text-[#1a1a1a]">{p.confidence}</b> confidence</span>
                        </p>
                        <div className="hidden space-y-1.5 sm:block">
                          {ctx.delta > 0 && <p className="flex items-center gap-2 text-[0.72rem] text-[#1a1a1a]/60"><span className="text-[#9a7a2e]"><IconTrendUp /></span><span><b className="font-semibold text-[#1a1a1a]">+{ctx.delta}</b> vs {p.marketShort} average</span></p>}
                          {/* bottom-half scores read as a plain rank — "Top 76%" is honest math that reads like a typo */}
                          {ctx.rank > 0 && <p className="flex items-center gap-2 text-[0.72rem] text-[#1a1a1a]/60"><span className="text-[#9a7a2e]"><IconTiers /></span><span>{ctx.bottomHalf ? <><b className="font-semibold text-[#1a1a1a]">Ranks {ctx.rank} of {ctx.total}</b> tracked projects</> : <><b className="font-semibold text-[#1a1a1a]">Top {ctx.topPct}%</b> of {ctx.total} tracked projects</>}</span></p>}
                          <p className="flex items-center gap-2 text-[0.72rem] text-[#1a1a1a]/60"><span className="text-[#9a7a2e]"><IconShieldCheck /></span><span><b className="font-semibold text-[#1a1a1a]">{p.confidence}</b> confidence · re-scored quarterly</span></p>
                        </div>
                      </div>
                    </div>
                    {/* one small readable line of provenance closes the stacked hero */}
                    <p className="mt-3 flex items-center gap-2 text-[0.6rem] font-light text-white/50 xl:hidden">
                      <IconClock /> <span className="truncate">{heroImage ? "Satellite view of the site" : "Independent assessment"} · data reviewed {reviewed}</span>
                    </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Below the hero — report body (col 1) with the rail beside it (col 2, row 2) */}
          <div className="min-w-0 xl:col-start-1 xl:row-start-2 mt-10 xl:mt-0">
            {/* Your Fit — the personal counterpart to the Truth Score, leading the body */}
            <MatchScore project={p} variant="band" />

            {/* The short answer — the 10-second executive read. The word
               "verdict" belongs to exactly one thing: the profile-tailored
               call at the end of the report. */}
            <div className="mt-11 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
              <Eyebrow>The short answer</Eyebrow>
              <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] md:text-[1.7rem]">{shortAnswer(p.reason)}</p>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-t border-[#1a1a1a]/8 pt-5">
                <p className="max-w-xl text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  <span className="font-medium text-[#1a1a1a]/70">Best suited for:</span> {investorFit(p).replace(/^Best suited for\s+/i, "")}
                </p>
                {locked ? (
                  <button onClick={() => setUnlockOpen(true)} className="shrink-0 text-[0.78rem] font-semibold text-[#1e6b45] transition-colors hover:text-[#238c55]">
                    🔒 Unlock your verdict →
                  </button>
                ) : (
                  <a href="#verdict" className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
                    Your personalised verdict ↓
                  </a>
                )}
              </div>
            </div>

            <Chapter n="I" title="Project Fundamentals" framing="The facts of the asset — before we weigh trust." />

            {/* Match Score now leads the report body as the "Your Fit" band (above) */}

            {/* 01 · Vitals — one uniform grid, one type language */}
            <Section id="vitals" n={num()} title="Vitals">
              <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8 md:p-10">
                {/* money facts — value-first, serif, 2×2 on mobile / 4-up on desktop */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
                  <Money v={(() => {
                    const cLow = live?.currentLow ?? ops?.price?.currentLow;
                    const band = live?.superAreaRange ?? p.sizeBand;
                    const t = cLow ? ticketFromPsf(cLow, band) : null;
                    const [lo, hi] = t ?? p.budget;
                    return lo === hi ? (lo ? `₹${lo} Cr+` : "NA") : `₹${lo}–${hi} Cr`;
                  })()} k="Ticket" />
                  {(live?.currentLow ?? ops?.price?.currentLow)
                    ? <Money v={`₹${kpsf(live?.currentLow ?? ops!.price!.currentLow)}k+`} k="Current / sq ft" />
                    : <Money v={p.psf ? fmtPsf(live?.corridorAvg ?? p.psf.avg) : "—"} k="Corridor avg / sq ft" />}
                  <Money v={configsDisplay(p.configs)} k="Configs" />
                  <Money v={live?.superAreaRange ?? p.sizeBand ?? "—"} k="Super sq ft" />
                </div>
                {/* the registry — dotted-leader detail list */}
                <div className="mt-9 grid border-t border-[#1a1a1a]/8 pt-4 md:grid-cols-2 md:gap-x-12">
                  {(live?.launchPsf ?? ops?.price?.launchPsf) != null && <Reg icon={VITAL_ICON.tag} k="Launch price / sq ft" v={fmtPsf(live?.launchPsf ?? ops!.price!.launchPsf)} />}
                  <Reg icon={VITAL_ICON.psf} k="Corridor avg / sq ft" v={(live?.corridorAvg ?? p.psf?.avg) ? fmtPsf((live?.corridorAvg ?? p.psf?.avg)!) : "NA"} />
                  {ops?.units != null && <Reg icon={VITAL_ICON.units} k="Total units" v={`${ops.units.toLocaleString("en-IN")}`} />}
                  <Reg icon={VITAL_ICON.towers} k="Towers" v={ops?.towers != null ? `${ops.towers}` : "NA"} />
                  <Reg icon={VITAL_ICON.land} k="Land" v={ops?.landAcres != null ? `${ops.landAcres} acre` : "NA"} />
                  {ops?.floors && <Reg icon={VITAL_ICON.floors} k="Floors" v={ops.floors} />}
                  {ops?.floors && riseTypeOf(ops.floors) && <Reg icon={VITAL_ICON.rise} k="Type" v={riseTypeOf(ops.floors)!} />}
                  <Reg icon={VITAL_ICON.density} k="Density" v={ops?.density != null ? `${ops.density} / acre` : "NA"} tag={ops?.density != null && ops.density <= 50 ? "Low-density" : undefined} />
                  <Reg icon={VITAL_ICON.leaf} k="Open area" v={ops?.openAreaPct != null ? `${ops.openAreaPct}%` : "NA"} tag={ops?.openAreaPct != null && ops.openAreaPct >= 80 ? "Green" : undefined} />
                  <Reg icon={VITAL_ICON.calendar} k="Launched" v={ops?.launch ?? "NA"} />
                  {ops?.possession && <Reg icon={VITAL_ICON.key} k="RERA possession" v={ops.possession} />}
                  <Reg icon={VITAL_ICON.file} k="RERA ID" v={ops?.reraId ?? "NA"} {...(ops?.reraId ? { href: ops?.reraUrl ?? "https://haryanarera.gov.in/" } : {})} />
                </div>
              </div>
            </Section>

            {/* 02 · Masterplan — the plan itself, then one honest read of it */}
            {ops?.media?.masterplan && (
              <Section id="masterplan" n={num()} title="Masterplan">
                <button
                  onClick={() => setDoc({ title: "Site masterplan", pages: [ops.media!.masterplan!.src], idx: 0 })}
                  aria-label="Enlarge the site masterplan"
                  className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img loading="lazy" src={asset(ops.media.masterplan.src)} alt={`${p.name} — site masterplan (indicative)`} className="w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                  {/* persistent enlarge affordance — the image is the click target */}
                  <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#0b1f1a]/70 px-3 py-1.5 text-[0.66rem] font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-[#0b1f1a]/90">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    Enlarge
                  </span>
                </button>
                <p className="mt-3.5 max-w-2xl text-[0.88rem] font-light leading-[1.65] text-[#1a1a1a]/60">{ops.media.masterplan.read}</p>
                <Source>Indicative layout from project filings — verify the RERA-approved siteplan before signing.</Source>
              </Section>
            )}

            {(ops?.homes?.length ?? 0) > 0 && (
              <Section id="homes" n={num()} title="The homes">
                <ReportHomes p={p} />
              </Section>
            )}

            {/* Tower & Unit Intelligence — the deep layer of Part 3. You've seen
               the homes and their floor plans; this is where you pick WHICH exact
               unit, in 3D. A product tier that belongs with the homes. */}
            <TowerIntel project={p} meta={towerIntelMeta(p)} />

            {/* 04 · Brochure & payment plan — documents on file render as cards;
               whatever is missing becomes an honest request tile (lead capture). */}
            <Section id="documents" n={num()} title="Brochure & payment plan">
                <div className="grid gap-5 sm:grid-cols-2">
                  {ops?.media?.brochure?.length ? (
                    <button
                      onClick={() => setDoc({ title: "Project brochure", pages: ops.media!.brochure!, idx: 0 })}
                      className="group overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60 text-left transition-colors hover:border-[#9a7a2e]/40"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#0b1f1a]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" src={asset(ops.media.brochure[0])} alt={`${p.name} brochure cover`} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
                      </div>
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="text-[0.92rem] font-semibold">Project brochure</p>
                          <p className="mt-0.5 text-[0.7rem] font-light text-[#1a1a1a]/45">{ops.media.brochure.length} pages · tap to read</p>
                        </div>
                        <span aria-hidden className="text-[#9a7a2e] transition-transform group-hover:translate-x-0.5">→</span>
                      </div>
                    </button>
                  ) : ops?.media?.brochurePdf ? (
                    <button
                      onClick={() => setDoc({ title: "Project brochure", pdf: ops.media!.brochurePdf! })}
                      className="group w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60 text-left transition-colors hover:border-[#9a7a2e]/40"
                    >
                      <PdfThumb thumb={ops.media.brochureThumb ? asset(ops.media.brochureThumb) : undefined} alt={`${p.name} brochure cover`} />
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="text-[0.92rem] font-semibold">Project brochure</p>
                          <p className="mt-0.5 text-[0.7rem] font-light text-[#1a1a1a]/45">The developer&rsquo;s file · PDF</p>
                        </div>
                        <span className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors group-hover:text-[#7a5f1e]">Open →</span>
                      </div>
                    </button>
                  ) : (
                    <DocSlot project={p.name} title="Project brochure" sub="The developer&rsquo;s full brochure" />
                  )}
                  {ops?.media?.paymentPlan ? (
                    <button
                      onClick={() => setDoc({ title: "Payment plan", pages: [ops.media!.paymentPlan!.src], idx: 0 })}
                      className="group overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60 text-left transition-colors hover:border-[#9a7a2e]/40"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#f0ece3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" src={asset(ops.media.paymentPlan.src)} alt={`${p.name} payment plan`} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
                      </div>
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="text-[0.92rem] font-semibold">Payment plan</p>
                          <p className="mt-0.5 text-[0.7rem] font-light text-[#1a1a1a]/45">{ops.media.paymentPlan.read}</p>
                        </div>
                        <span aria-hidden className="text-[#9a7a2e] transition-transform group-hover:translate-x-0.5">→</span>
                      </div>
                    </button>
                  ) : ops?.media?.paymentPlanPdf ? (
                    <button
                      onClick={() => setDoc({ title: "Payment plan", pdf: ops.media!.paymentPlanPdf! })}
                      className="group w-full overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60 text-left transition-colors hover:border-[#9a7a2e]/40"
                    >
                      <PdfThumb thumb={ops.media.paymentPlanThumb ? asset(ops.media.paymentPlanThumb) : undefined} alt={`${p.name} payment plan cover`} />
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="text-[0.92rem] font-semibold">Payment plan</p>
                          <p className="mt-0.5 text-[0.7rem] font-light text-[#1a1a1a]/45">The developer&rsquo;s file · PDF</p>
                        </div>
                        <span className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors group-hover:text-[#7a5f1e]">Open →</span>
                      </div>
                    </button>
                  ) : (
                    <DocSlot project={p.name} title="Payment plan" sub="Milestones and due percentages" />
                  )}
                  {/* Master plan appears here as a slot only when it lacks its own section above */}
                  {!ops?.media?.masterplan && <DocSlot project={p.name} title="Master plan / site map" sub="The RERA-approved site layout" />}
                  {/* Floor plans intentionally omitted here — they live in The Homes section above. */}
                </div>
                <Source>{ops?.media?.brochure || ops?.media?.brochurePdf || ops?.media?.paymentPlan || ops?.media?.paymentPlanPdf ? "Developer documents on file — indicative until countersigned." : "Documents arrive as the desk sources them — indicative until countersigned."} GST, PLC, IFMS &amp; registration additional as applicable.</Source>
              </Section>

            <Chapter n="II" title="Can we trust it?" framing="Five pillars — developer, build, location, paperwork, edge." />

            {/* Truth Score anatomy — the composition spine */}
            <div id="anatomy" className="scroll-mt-24">
              <ReportAnatomy p={p} locked={locked} onUnlock={() => setUnlockOpen(true)} />
            </div>

            {/* ── The paywall boundary. From Chapter II · Pillar I (Developer DNA)
               down, a guest sees the LockedReport (unlock card + redacted teaser)
               in place of the analysis; a paid reader sees everything. ── */}
            {locked ? (
              <div id="unlock" className="scroll-mt-24">
                <LockedReport projectName={p.name} truthScore={p.truthScore} grade={scoreGrade(p.truthScore)} ticket={lockedTicket} onUnlock={() => setUnlockOpen(true)} sampleHref={SAMPLE_HREF} />
              </div>
            ) : (
            <>
            {/* Pillar I · Developer DNA — track record + financial audit */}
            {dev && (
              <div id="developer" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportDeveloper p={p} />
              </div>
            )}

            {/* Pillar II · Construction & Sales */}
            {con && (
              <div id="construction" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportConstruction p={p} />
              </div>
            )}

            {/* Pillar III · Location Intelligence */}
            {locIntel && (
              <div id="location" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportLocation p={p} />
              </div>
            )}

            {/* Pillar IV · Legal & Compliance */}
            <div id="legal" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
              <ReportLegal p={p} />
            </div>

            {/* Pillar V · Project USPs */}
            {usps.length > 0 && (
              <div id="usps" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportUSPs p={p} />
              </div>
            )}

            <Chapter n="III" title="Will it make money?" framing="The price journey — and where our model says it's headed." />

            {/* Price dynamics + projection + ROI calculator */}
            {roi && (
              <div id="roi" className="scroll-mt-24">
                <ReportPrice p={p} sample={sample} />
              </div>
            )}

            <Chapter n="IV" title="Decision time." framing="The same evidence, read for your situation." />

            {/* The verdict — profile-tailored */}
            <div id="verdict" className="scroll-mt-24">
              <ReportVerdict p={p} onConsult={consult} />
            </div>

            {/* Strengths & watch-outs */}
            {(p.strengths.length > 0 || p.watchouts.length > 0) && (
            <Section id="strengths" n={num()} title="Strengths & watch-outs">
              <div className="grid gap-8 md:grid-cols-2">
                {p.strengths.length > 0 && (
                <div className="rounded-2xl border border-[#1e6b45]/15 bg-[#1e6b45]/[0.04] p-7">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1e6b45]">What works</p>
                  <ul className="mt-4 space-y-3">
                    {p.strengths.map((s) => (
                      <li key={s} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#1e6b45]">+</span>{s}</li>
                    ))}
                  </ul>
                </div>
                )}
                {p.watchouts.length > 0 && (
                <div className="rounded-2xl border border-[#9a7a2e]/20 bg-[#c9a96e]/[0.06] p-7">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#9a7a2e]">What to watch</p>
                  <ul className="mt-4 space-y-3">
                    {p.watchouts.map((w) => (
                      <li key={w} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#9a7a2e]">!</span>{w}</li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
            </Section>
            )}

            {/* 10 · What this serves */}
            {p.tags.length > 0 && (
            <Section id="serves" n={num()} title="What this serves">
              <p className="-mt-2 mb-5 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/50">The buyer priorities this project genuinely answers — on the evidence, not the brochure.</p>
              <div className="flex flex-wrap gap-2.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full border border-[#1a1a1a]/12 px-4 py-2 text-[0.82rem] font-light text-[#1a1a1a]/65">{t}</span>
                ))}
              </div>
            </Section>
            )}

            {/* Straight answers */}
            {faqs.length > 0 && (
              <Section id="faqs" n={num()} title="Straight answers">
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  The questions that actually decide the purchase — answered from registry data, live construction and micro-market dynamics.
                </p>
                <div className="divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
                  {faqs.map((f) => (
                    <details key={f.q} className="group px-6 py-5 md:px-7">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.98rem] font-medium text-[#1a1a1a]/85">
                        {f.q}
                        <span className="shrink-0 font-mono text-[1.1rem] text-[#c9a96e] transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 text-[0.9rem] font-light leading-[1.75] text-[#1a1a1a]/60">{f.a}</p>
                    </details>
                  ))}
                </div>
                {/* Still curious? The AI challenge lives here now, right where the
                   questions do — not competing with the advisor CTA below. */}
                <button onClick={challenge} className="group mt-5 flex w-full items-center gap-4 rounded-2xl border border-[#0B1F1A]/12 bg-[#0B1F1A]/[0.04] px-6 py-5 text-left transition-colors hover:border-[#B29668]/50 hover:bg-[#0B1F1A]/[0.06]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0B1F1A] text-[1.05rem] text-[#B29668]" aria-hidden>◆</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] font-semibold text-[#1a1a1a]">Still have a question? Challenge TruthGuide.</span>
                    <span className="mt-0.5 block text-[0.82rem] font-light leading-[1.5] text-[#1a1a1a]/55">Ask our AI anything about {p.name} — pricing, risks, the fine print.</span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[#9a7a2e] transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </Section>
            )}

            {/* Chapter V — the alternatives, as full report cards ranked to the
               reader's brief when they've set one. */}
            <Chapter n="V" title={`If not ${p.name}, then what?`} framing="Comparable projects to weigh side by side — ranked to your brief where you've set one." />
            <section id="alternatives" className="scroll-mt-24">
              <ReportExplore p={p} embedded={embedded} onSelect={onSelectAlternative} />
            </section>
            </>
            )}

            {/* The Independent Desk on mobile — the desktop rail is hidden below
               xl, so the founder gets a face here, right before the CTA. When
               locked, the free-call block would leak conversions, so it becomes
               the price-forward UnlockDesk instead. */}
            {locked ? (
              <div className="mt-12 xl:hidden">
                <UnlockDesk onUnlock={() => setUnlockOpen(true)} sampleHref={SAMPLE_HREF} />
              </div>
            ) : (
            <div className="mt-12 rounded-2xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6 xl:hidden">
              <div className="flex items-center gap-3.5">
                {/* the human is the seal — the real founder, not a badge */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain — Founder, Truth Estate" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#B29668]/50" />
                <div className="min-w-0">
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]">The Independent Desk</p>
                  <p className="mt-0.5 text-[0.9rem] font-semibold leading-tight text-[#1a1a1a]">Gaurav Jain</p>
                  <p className="text-[0.7rem] font-light text-[#1a1a1a]/45">Founder, Truth Estate</p>
                </div>
              </div>
              <p className="mt-4 font-serif text-[1.28rem] font-medium leading-[1.26] text-[#1a1a1a]">Talk to someone who has actually read this file.</p>
              <button onClick={consult} className="group mt-4 flex w-full items-center justify-between rounded-xl bg-[#1e6b45] px-5 py-3.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#238c55]">
                Book a 15-minute call <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
              <p className="mt-4 border-t border-[#1a1a1a]/8 pt-3.5 text-[0.64rem] font-light leading-[1.5] text-[#1a1a1a]/40">Every file crosses the founder&apos;s desk before it ships. Independent — no inventory, no builder commission.</p>
            </div>
            )}

            {/* CTA — three actions, weighted */}
            <div className="relative mt-14 overflow-hidden rounded-2xl bg-[#0B1F1A] p-8 text-white md:p-10">
              <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(30,107,69,0.35), transparent 70%)", filter: "blur(28px)" }} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />
              <div className="relative">
                <div className="max-w-xl">
                  <h2 className="font-serif text-[1.7rem] font-medium leading-[1.15] md:text-[2rem]">Considering {p.name}?</h2>
                  <p className="mt-2 text-[0.88rem] font-light text-white/55">Get an independent read — the right price, the right stack, the honest risks — before you commit.</p>
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-2">
                  <ActionCell tone="primary" icon="●" title={primaryCta.label} desc={locked ? "The full report · from ₹999" : "45-min advisor call · free"} onClick={primaryCta.onClick} />
                  <ActionCell tone="secondary" icon={<IconCube className="h-[0.95rem] w-[0.95rem]" />} title="Sun & Vastu 3D" desc="3D sun & unit model · ₹1,499 a project" onClick={openUnitIntel} />
                </div>
                <p className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-[0.72rem] font-light text-white/40">
                  <span className="text-[#B29668]" aria-hidden>◆</span> We represent only you — never the developer.
                </p>
              </div>
            </div>

            {/* Rate · report an error · share — only once the reader actually has
               the read; nobody rates or shares a locked report. */}
            {!locked && <ReportFeedback slug={p.slug} name={p.name} />}

            <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
              Independent assessment by Truth Estate. No developer can pay for a higher Truth Score or to appear here. The Truth Score, Match Score and any recommendation are our own evidence-based <span className="italic">opinions</span> as of {reviewed} — not a guarantee of performance, safety, appreciation or returns, and not investment, legal or financial advice. Ticket and price bands, ROI projections and delivery estimates are tracked or modelled figures that vary by tower, floor and stack. The decision, and its risks, are yours; we are not liable for the performance of any project. Verify specifics independently and see our{" "}
              <a href={`${basePath}/disclaimer`} className="underline decoration-[#1a1a1a]/20 underline-offset-2 transition-colors hover:text-[#1a1a1a]/60">full disclaimer</a>.
              {/* demo-only: start over as a first-time visitor */}
              <button onClick={() => { clearAllDemoData(); window.location.reload(); }} className="ml-2 underline decoration-[#1a1a1a]/15 underline-offset-2 transition-colors hover:text-[#1a1a1a]/60">Reset demo</button>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: a single, clean primary CTA. When unlocked, the founder's face
          rides beside the advisor call (advice reads as a person); when locked,
          a clean full-width "Get Full Read" drives the sale. */}
      <div className="sticky bottom-0 z-40 flex items-center gap-3 border-t border-[#1a1a1a]/10 bg-[#F5F0E8]/95 px-6 py-3 backdrop-blur md:hidden">
        {!locked && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain — Founder, Truth Estate" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#B29668]/50" />
        )}
        <button onClick={primaryCta.onClick} className="flex-1 rounded-sm bg-[#1e6b45] px-5 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
          {primaryCta.label}
        </button>
      </div>

      {/* Document viewer — masterplan / brochure pages / payment plan */}
      {doc && (
        <div className="fixed inset-0 z-[140] flex flex-col bg-[#0b1f1a]/90 backdrop-blur-sm" onClick={() => setDoc(null)}>
          <div className="flex items-center justify-between gap-4 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#B29668]">
              {doc.title}
              {"pages" in doc && doc.pages.length > 1 && <span className="ml-3 font-mono text-white/45 normal-case tracking-normal">{doc.idx + 1} / {doc.pages.length}</span>}
              {"pdf" in doc && <span className="ml-3 font-mono text-white/45 normal-case tracking-normal">PDF</span>}
            </p>
            <div className="flex items-center gap-1.5">
              {"pdf" in doc && (
                <a href={asset(doc.pdf)} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-1.5 text-[0.72rem] font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white">Open in new tab ↗</a>
              )}
              <button onClick={() => setDoc(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">✕</button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            {"pdf" in doc ? (
              <PdfScroller src={asset(doc.pdf)} />
            ) : (
              <>
                {/* key resets the zoom whenever the page turns */}
                <ZoomStage key={doc.idx}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(doc.pages[doc.idx])} alt={`${doc.title} — page ${doc.idx + 1}`} className="max-h-[78vh] max-w-full rounded-lg shadow-[0_30px_90px_rgba(0,0,0,0.5)]" draggable={false} />
                </ZoomStage>
                {doc.pages.length > 1 && (
                  <>
                    <button
                      onClick={() => setDoc({ ...doc, idx: (doc.idx - 1 + doc.pages.length) % doc.pages.length })}
                      aria-label="Previous page"
                      className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-[1.2rem] text-white/85 backdrop-blur transition-colors hover:bg-white/20"
                    >←</button>
                    <button
                      onClick={() => setDoc({ ...doc, idx: (doc.idx + 1) % doc.pages.length })}
                      aria-label="Next page"
                      className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-[1.2rem] text-white/85 backdrop-blur transition-colors hover:bg-white/20"
                    >→</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Unlock (register → pay) — the conversion surface for a locked read */}
      {unlockOpen && (
        <UnlockModal
          open
          slug={p.slug}
          projectName={p.name}
          focus3D={unlockFocus3D}
          has3DModel={has3D}
          onClose={() => { setUnlockOpen(false); setUnlockFocus3D(false); }}
          onUnlocked={() => { setReadAccess(hasReadAccess(p.slug)); setThreeDAccess(has3DAccess(p.slug)); }}
        />
      )}

      {/* "Challenge our read" — the project-scoped, paywall-aware advisor.
         Answers public facts freely; teases + gates paid findings when locked. */}
      <ChallengeChat
        p={p}
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        locked={locked}
        onUnlock={() => { setUnlockFocus3D(false); setUnlockOpen(true); }}
        has3DModel={has3D}
        has3DAccess={threeDAccess}
        onUnlock3D={() => { setUnlockFocus3D(true); setUnlockOpen(true); }}
      />

      {/* Floating "Challenge our read" — standalone pages only, the single
         project-scoped entry (the site-wide TruthGuide bubble is suppressed on
         project pages). On mobile it rides just above the sticky primary CTA,
         kept visually subordinate to it; on desktop it's the corner pill. */}
      {!embedded && !challengeOpen && (
        <button
          onClick={challenge}
          aria-label={`Challenge our read on ${p.name}`}
          className="group fixed bottom-[76px] right-4 z-40 flex items-center gap-2.5 rounded-full border border-[#c9a96e]/30 bg-[#0a0a0a]/95 py-2 pl-2 pr-4 text-white shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] backdrop-blur transition-all duration-300 hover:border-[#c9a96e]/60 md:bottom-5 md:right-5 md:gap-3 md:py-2.5 md:pl-2.5 md:pr-5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e6b45] text-[0.9rem] transition-transform duration-300 group-hover:scale-105 md:h-9 md:w-9 md:text-[0.95rem]">◆</span>
          <span className="text-left leading-tight">
            <span className="hidden text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#c9a96e] md:block">TruthGuide</span>
            <span className="block text-[0.78rem] font-medium md:text-[0.82rem]">Challenge our read &rarr;</span>
          </span>
        </button>
      )}

      {/* Sample read — a faint diagonal tiled watermark + a persistent badge so
          the dummy report can never be mistaken for a paid one. */}
      {sample && (
        <>
          <div aria-hidden className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
            <div
              className="absolute left-1/2 top-1/2 select-none text-center font-serif text-[1.4rem] font-bold uppercase leading-[4.5rem] tracking-[0.35em] text-[#1a1a1a]"
              style={{ width: "200vmax", height: "200vmax", transform: "translate(-50%, -50%) rotate(-28deg)", opacity: 0.07, wordSpacing: "1.5rem" }}
            >
              {SAMPLE_WATERMARK_TEXT}
            </div>
          </div>
          <div aria-hidden className="pointer-events-none fixed left-1/2 top-3 z-[45] -translate-x-1/2">
            <span className="rounded-full border border-[#9a7a2e]/40 bg-[#F5F0E8]/90 px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#9a7a2e] shadow-sm backdrop-blur-sm">Sample read</span>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#1a1a1a]/12 bg-white/50 px-3 py-1 text-[0.66rem] font-medium tracking-[0.02em] text-[#1a1a1a]/55">{children}</span>;
}

function ActionCell({ tone, icon, title, desc, onClick }: { tone: "primary" | "secondary" | "ghost"; icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  const box =
    tone === "primary" ? "bg-[#1e6b45] hover:bg-[#238c55]"
    : tone === "secondary" ? "border border-white/15 bg-white/[0.03] hover:border-[#46c2ff]/60"
    : "border border-white/10 bg-white/[0.01] hover:border-white/25";
  const iconColor = tone === "primary" ? "text-white/85" : tone === "secondary" ? "text-[#46c2ff]" : "text-[#c9a96e]";
  const titleColor = tone === "primary" ? "text-white" : "text-white/90";
  const descColor = tone === "primary" ? "text-white/70" : "text-white/45";
  return (
    <button onClick={onClick} className={`group flex flex-col gap-2 rounded-xl p-5 text-left transition-all duration-200 ${box}`}>
      <span className="flex items-center gap-2.5">
        <span className={`text-[0.9rem] ${iconColor}`} aria-hidden>{icon}</span>
        <span className={`text-[0.92rem] font-medium ${titleColor}`}>{title}</span>
        <span className={`ml-auto opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 ${titleColor}`} aria-hidden>→</span>
      </span>
      <span className={`text-[0.74rem] font-light leading-[1.4] ${descColor}`}>{desc}</span>
    </button>
  );
}

function Section({ id, n, title, children, flush }: { id?: string; n: string; title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-24 ${flush ? "mt-9" : "mt-16 border-t border-[#1a1a1a]/8 pt-12 md:mt-20"}`}>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.8rem] text-[#c9a96e]">{n}</span>
        <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] text-[#1a1a1a] md:text-[2.1rem]">{title}</h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/* A narrative divider — chapters the report into a story instead of a stack
   of data dumps. The section that follows renders flush (no extra rule). */
function Chapter({ n, title, framing }: { n: string; title: string; framing: string }) {
  return (
    <div className="mt-20 border-t border-[#1a1a1a]/10 pt-11 md:mt-28">
      <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.26em] text-[#c9a96e]">Chapter {n}</span>
      <h2 className="mt-3.5 max-w-2xl font-serif text-[2.1rem] font-medium leading-[1.04] tracking-[-0.015em] md:text-[2.9rem]">{title}</h2>
      {/* one whisper line, not a paragraph — the headline does the talking */}
      <p className="mt-2.5 text-[0.82rem] font-light tracking-[0.01em] text-[#1a1a1a]/40">{framing}</p>
    </div>
  );
}

function scoreGrade(s: number): ScoreTag {
  return s >= 90 ? "Exceptional" : s >= 80 ? "Strong" : s >= 70 ? "Solid" : s >= 60 ? "Fair" : "Watch";
}

/* The Truth Score's band as a pill — same treatment as the search-result cards
   (outlined, band-coloured via TAG_CHIP) so the hero and search surfaces match. */
function ScoreGradePill({ score }: { score: number }) {
  const g = scoreGrade(score);
  const s = TAG_CHIP[g];
  return (
    <span className="inline-block rounded-[11px] px-2 py-[3px] text-[10.5px] font-medium leading-none" style={{ color: s.text, border: `0.5px solid ${s.border}` }}>
      {g}
    </span>
  );
}

/* The short answer — reformat the pipeline's terse data-caption
   ("<Reco> project. <n>% construction complete. <a>/<b> units sold.") into a
   cleaner one-liner. Any other (prose) reason is left as-is, bar swapping a
   raw units fraction for a percentage. */
function shortAnswer(reason: string): string {
  const s = (reason ?? "").trim();
  const m = s.match(/^([A-Za-z][A-Za-z ]{2,22}?)\s+project\.\s*(\d+)%\s*construction\s*complete\.\s*(\d+)\s*\/\s*(\d+)\s*units\s*sold\.?\s*$/i);
  if (m) {
    const reco = m[1].trim();
    const lead = /review/i.test(reco) ? reco : `${reco}-grade`;
    const pct = Math.round((Number(m[3]) / Number(m[4])) * 100);
    return `${lead}. ${m[2]}% built · ${pct}% sold (${m[3]} of ${m[4]} units).`;
  }
  return s.replace(/(\d+)\s*\/\s*(\d+)\s*units\s*sold/i, (_, n, t) => `${Math.round((Number(n) / Number(t)) * 100)}% sold (${n} of ${t} units)`);
}

/* ── one consistent line-icon set for the hero (replaces ad-hoc unicode glyphs) ── */
const ICN = "inline-block h-[1.05em] w-[1.05em] shrink-0 align-[-0.15em]";
function IconPin({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12 21c4.4-4 7-7.1 7-11a7 7 0 1 0-14 0c0 3.9 2.6 7 7 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>);
}
function IconBed({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M3 5v14" /><path d="M3 9h16a2 2 0 0 1 2 2v8" /><path d="M3 16h18" /><path d="M7 9v7" /></svg>);
}
function IconTag({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12.3 2.6 21 11.3a1.4 1.4 0 0 1 0 2L13.3 21a1.4 1.4 0 0 1-2 0L2.6 12.3A2 2 0 0 1 2 10.9V4a2 2 0 0 1 2-2h6.9a2 2 0 0 1 1.4.6Z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>);
}
function IconArrowUpRight({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`inline-block h-[0.82em] w-[0.82em] shrink-0 align-[-0.02em] ${className}`} aria-hidden><path d="M8 16 16 8M9.5 8H16v6.5" /></svg>);
}
function IconAward({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><circle cx="12" cy="9" r="5" /><path d="M9.2 13.2 8 21l4-2.2L16 21l-1.2-7.8" /></svg>);
}
function IconBuilding({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h6A1.5 1.5 0 0 1 13 5.5V21" /><path d="M13 10h5.5A1.5 1.5 0 0 1 20 11.5V21" /><path d="M3 21h18M7 8h2M7 12h2M7 16h2M16 14h1M16 17.5h1" /></svg>);
}
function IconCube({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>);
}
function IconTrendUp({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M3 16.5 9 10.5l3.5 3.5L21 5.5" /><path d="M15 5.5h6v6" /></svg>);
}
function IconTiers({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M4 20h16" /><path d="M7 20v-3.5M12 20v-7M17 20v-10.5" /></svg>);
}
function IconShieldCheck({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12 3 5 5.8v5.5c0 4 3 6.9 7 8.2 4-1.3 7-4.2 7-8.2V5.8L12 3Z" /><path d="M9 11.6 11 13.6 15 9.4" /></svg>);
}
function IconClock({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><circle cx="12" cy="12" r="8.2" /><path d="M12 7.6V12l3 1.8" /></svg>);
}
