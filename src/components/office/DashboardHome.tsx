"use client";

/* ════════════════════════════════════════════════════════════════
   DASHBOARD HOME — a verdict, not a mirror.

   The old home told the visitor things they already knew: how many
   reports they had read, which stage they were at. Nobody needs a site to
   tell them what they just did. The only question worth answering here is
   "given everything you know about me, what should I do?" — and we are
   the only party who can, because we hold both their behaviour and the
   scoring.

   TWO STATES, and which one shows is the whole design:

     A · no brief    the page IS the capture. We guess from what they have
                     read and ask them to CONFIRM, because confirming beats
                     filling in, and every guess carries its evidence.
     B · brief known a verdict, then the one thing to do next, then the fit
                     table — with fit-to-brief and Truth Score as separate
                     columns. A 90 that does not fit you is still the wrong
                     flat, and merging them would hide exactly that.

   Everything the buyer already knows — reports read, sessions, unlocks —
   is demoted to a thin strip near the bottom. It is context, not content.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBuyerBrief, type BuyerBrief, type BriefProject } from "@/lib/buyerBrief";
import { fitFor, rankByFit, verdictFor } from "@/lib/fit";
/* projectPath, not projectHref: next/link applies basePath itself, so a
   href that already carries it comes out doubled — /Truth-Estate/Truth-
   Estate/projects/… on any build with a non-empty base path. */
import { projectPath } from "@/lib/projectHref";
import { loadBuyData, saveBuyData, emptyBuyData, packageById } from "@/lib/journey";
import { useJourney } from "@/components/journey/JourneyProvider";

/* ── shared atoms, matched to the office's existing tokens ──────── */
const CARD = "rounded-xl border border-[#1a1a1a]/[0.08] bg-white";
const EYEBROW = "text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40";
const GOLD = "text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]";

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-28 rounded bg-[#1a1a1a]/8" />
      <div className="mt-5 h-9 w-3/4 rounded bg-[#1a1a1a]/8" />
      <div className="mt-3 h-9 w-1/2 rounded bg-[#1a1a1a]/8" />
      <div className="mt-9 h-40 rounded-xl bg-[#1a1a1a]/[0.06]" />
      <div className="mt-6 h-56 rounded-xl bg-[#1a1a1a]/[0.06]" />
    </div>
  );
}

export default function DashboardHome({ name }: { name?: string | null }) {
  const [brief, setBrief] = useState<BuyerBrief | null>(null);
  const { open: openJourney } = useJourney();

  useEffect(() => { void loadBuyerBrief().then(setBrief); }, []);
  if (!brief) return <Skeleton />;

  return brief.known
    ? <StateB brief={brief} name={name} onEditBrief={() => openJourney()} />
    : <StateA brief={brief} name={name} onOpenBrief={() => openJourney()} />;
}

/* ════════════════════════════════════════════════════════════════
   STATE A — we don't know what they want yet.

   The entire page is the ask. Not a form: a set of guesses drawn from
   what they have actually read, each with the reason it was guessed, and
   a single button that means "yes, that's me". A visitor with no trail
   sees the same frame with empty guesses and a plain invitation, which is
   the honest version of the same screen.
   ════════════════════════════════════════════════════════════════ */
function StateA({ brief, name, onOpenBrief }: { brief: BuyerBrief; name?: string | null; onOpenBrief: () => void }) {
  const guesses = [
    { label: "Corridor", field: brief.corridor },
    { label: "Budget", field: brief.budgetCr },
    { label: "Configuration", field: brief.config },
    { label: "Timeline", field: brief.timeline },
  ];
  const anyGuess = guesses.some((g) => g.field.value != null);

  /* Accepting the guess writes it into the same BuyData the rest of the
     journey reads, so one tap produces a real brief rather than a
     dashboard-only fiction. */
  function acceptGuess() {
    const buy = { ...emptyBuyData, ...(loadBuyData() ?? {}) };
    if (brief.corridor.value) buy.locations = brief.corridor.value;
    if (brief.budgetCr.value) buy.budgetCr = Math.round((brief.budgetCr.value.min + brief.budgetCr.value.max) / 2);
    if (brief.config.value) buy.configs = [brief.config.value];
    saveBuyData(buy);
    onOpenBrief();
  }

  return (
    <div className="animate-fade-up">
      <p className={EYEBROW}>{name ? `${name.split(" ")[0]}, one thing first` : "One thing first"}</p>
      <h1 className="mt-3 max-w-[18ch] font-serif text-[2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[2.9rem]">
        We know what you&rsquo;ve been reading.
        <span className="text-[#1a1a1a]/40"> We don&rsquo;t yet know what you want.</span>
      </h1>
      <p className="mt-4 max-w-[52ch] text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55">
        Tell us the brief and every read on this site starts answering <em className="not-italic text-[#1a1a1a]/80">your</em> question
        instead of a general one.
      </p>

      {anyGuess ? (
        <div className={`mt-9 overflow-hidden ${CARD}`}>
          <div className="border-b border-[#1a1a1a]/[0.07] px-6 py-4 md:px-8">
            <p className={GOLD}>From your reading, we&rsquo;d guess</p>
          </div>
          <div className="divide-y divide-[#1a1a1a]/[0.06]">
            {guesses.map((g) => (
              <div key={g.label} className="flex flex-col gap-1 px-6 py-4 md:flex-row md:items-baseline md:gap-6 md:px-8">
                <p className="w-[7.5rem] shrink-0 text-[0.7rem] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/40">{g.label}</p>
                <div className="min-w-0 flex-1">
                  <p className={`font-serif text-[1.15rem] leading-tight ${g.field.value ? "text-[#1a1a1a]" : "text-[#1a1a1a]/30"}`}>
                    {g.field.value ? g.field.display : "—"}
                  </p>
                  {g.field.evidence && (
                    <p className="mt-1 text-[0.76rem] font-light leading-snug text-[#1a1a1a]/45">{g.field.evidence}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#1a1a1a]/[0.07] bg-[#1a1a1a]/[0.015] px-6 py-5 sm:flex-row md:px-8">
            <button
              onClick={acceptGuess}
              className="rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.85rem] font-medium tracking-[0.03em] text-white transition-colors hover:bg-[#238c55]"
            >
              Looks right — continue →
            </button>
            <button
              onClick={onOpenBrief}
              className="rounded-sm border border-[#1a1a1a]/15 px-7 py-3.5 text-[0.85rem] font-light text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
            >
              Let me change it
            </button>
          </div>
        </div>
      ) : (
        <div className={`mt-9 ${CARD} px-6 py-8 md:px-8`}>
          <p className="max-w-[46ch] text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60">
            {/* Never claim they have read too little when the truth is that
                we could not look. One is about them and one is about us. */}
            {brief.unavailable
              ? "We couldn't reach your reading history just now — so we'll ask instead rather than guess wrong. It takes about a minute."
              : "You haven't opened enough reports for us to guess yet — so we'll ask instead. It takes about a minute, and you can change any of it later."}
          </p>
          <button
            onClick={onOpenBrief}
            className="mt-6 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.85rem] font-medium tracking-[0.03em] text-white transition-colors hover:bg-[#238c55]"
          >
            Build my brief →
          </button>
        </div>
      )}

      {/* The two things browsing can never reveal. Stated plainly so the
          ask reads as candour rather than another form field. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { t: "Buying to live in, or to invest?", b: "It changes which floor, which facing, and which risks actually matter to you." },
          { t: "When do you need possession?", b: "A ready flat and a 2029 handover are different markets, not different filters." },
        ].map((q) => (
          <div key={q.t} className={`${CARD} px-5 py-5`}>
            <p className="font-serif text-[1.02rem] leading-snug text-[#1a1a1a]">{q.t}</p>
            <p className="mt-2 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/50">{q.b}</p>
          </div>
        ))}
      </div>

      {brief.projects.length > 0 && <LockedFitPreview projects={brief.projects} />}
      <Services />
    </div>
  );
}

/* What the brief unlocks, shown dimmed. The point of the blur is not
   theatre — it is that the columns are real and computed, and the only
   missing input is theirs. */
function LockedFitPreview({ projects }: { projects: BriefProject[] }) {
  return (
    <div className="mt-10">
      <p className={EYEBROW}>What this unlocks</p>
      <div className={`relative mt-3 overflow-hidden ${CARD}`}>
        <div aria-hidden className="pointer-events-none select-none opacity-[0.35] blur-[2px]">
          <table className="w-full text-left">
            <tbody className="divide-y divide-[#1a1a1a]/[0.06]">
              {projects.slice(0, 4).map((p) => (
                <tr key={p.slug}>
                  <td className="px-6 py-4 font-serif text-[1.02rem] text-[#1a1a1a]">{p.name}</td>
                  <td className="px-4 py-4 text-right text-[0.8rem] font-light text-[#1a1a1a]/45">fit ··</td>
                  <td className="px-6 py-4 text-right text-[0.8rem] font-light text-[#1a1a1a]/45">{p.truthScore ?? "··"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-white/40 to-white/85 px-6 text-center">
          <p className="max-w-[34ch] text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/65">
            Every project you&rsquo;ve opened, scored against <em className="not-italic font-medium text-[#1a1a1a]">your</em> brief —
            not just against each other.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STATE B — we know the brief. Lead with the answer.
   ════════════════════════════════════════════════════════════════ */
function StateB({ brief, name, onEditBrief }: { brief: BuyerBrief; name?: string | null; onEditBrief: () => void }) {
  const ranked = rankByFit(brief.projects, brief);
  const verdict = verdictFor(brief, ranked);
  const weakest = ranked.find((r) => (r.fit.score ?? 100) < 60 && r.p.views > 1);
  const best = ranked.find((r) => (r.fit.score ?? 0) >= 80 && !r.p.paid);

  return (
    <div className="animate-fade-up">
      <p className={EYEBROW}>{name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back"}</p>

      {/* THE VERDICT — the only thing on this page nobody else could write */}
      <div className="mt-4 overflow-hidden rounded-xl bg-[#1a1a1a] text-white">
        <div className="px-7 py-8 md:px-10 md:py-10">
          <p className={GOLD}>Our read on your search</p>
          {/* The verdict IS the page's heading. Rendering it as a <p> left
              State B with no h1 at all — one heading per page is not a
              style rule, it is how the page announces itself to a screen
              reader and to a crawler. */}
          <h1 className="mt-4 max-w-[46ch] font-serif text-[1.35rem] font-medium leading-[1.35] md:text-[1.85rem]">
            {verdict ?? "You've told us the brief. Open a few reports and we'll tell you which of them actually answer it."}
          </h1>
          <button
            onClick={onEditBrief}
            className="mt-6 text-[0.78rem] font-light text-white/45 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
          >
            {[brief.config.display, brief.corridor.display, brief.budgetCr.display].filter((s) => s && s !== "NA").join(" · ") || "Edit your brief"}
          </button>
        </div>
      </div>

      {/* ONE next action, chosen from the fit table rather than a fixed script */}
      {(weakest || best) && (
        <div className={`mt-6 ${CARD} px-6 py-6 md:px-8`}>
          <p className={GOLD}>Do this next</p>
          {weakest ? (
            <>
              <p className="mt-3 max-w-[54ch] font-serif text-[1.2rem] leading-snug text-[#1a1a1a]">
                You keep returning to {weakest.p.name} — but it {weakest.fit.misses[0] ?? "doesn't match your brief"}.
              </p>
              <p className="mt-2 max-w-[54ch] text-[0.86rem] font-light leading-relaxed text-[#1a1a1a]/55">
                Worth knowing before you visit. The full read tells you whether that gap is negotiable.
              </p>
              <Link href={projectPath(weakest.p)} className="mt-5 inline-block rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.82rem] font-medium text-white transition-colors hover:bg-[#238c55]">
                Open the read on {weakest.p.name} →
              </Link>
            </>
          ) : best ? (
            <>
              <p className="mt-3 max-w-[54ch] font-serif text-[1.2rem] leading-snug text-[#1a1a1a]">
                {best.p.name} is the closest thing to your brief that you haven&rsquo;t unlocked.
              </p>
              <p className="mt-2 max-w-[54ch] text-[0.86rem] font-light leading-relaxed text-[#1a1a1a]/55">
                ₹{packageById("read").inr.toLocaleString("en-IN")} — about 0.01% of the ticket you&rsquo;re considering.
              </p>
              <Link href={projectPath(best.p)} className="mt-5 inline-block rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.82rem] font-medium text-white transition-colors hover:bg-[#238c55]">
                Unlock the full read →
              </Link>
            </>
          ) : null}
        </div>
      )}

      {ranked.length > 0 && <FitTable ranked={ranked} />}
      <FounderCall />
      <ActivityStrip brief={brief} />
      <ComingSoon />
      <Services />
    </div>
  );
}

/* The fit table. Two separate readings, deliberately not merged. */
function FitTable({ ranked }: { ranked: ReturnType<typeof rankByFit> }) {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={EYEBROW}>Against your brief</p>
        <p className="text-[0.72rem] font-light text-[#1a1a1a]/40">Fit is about you. Truth Score is about the project.</p>
      </div>

      <div className={`mt-3 overflow-hidden ${CARD}`}>
        <div className="divide-y divide-[#1a1a1a]/[0.06]">
          {ranked.map(({ p, fit }) => (
            <Link key={p.slug} href={projectPath(p)} className="block px-5 py-5 transition-colors hover:bg-[#1a1a1a]/[0.015] md:px-7">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0 flex-1 basis-[13rem]">
                  <p className="truncate font-serif text-[1.08rem] leading-tight text-[#1a1a1a]">{p.name}</p>
                  <p className="mt-1 truncate text-[0.76rem] font-light text-[#1a1a1a]/45">
                    {[p.microMarket, p.minPriceCr != null ? `from ₹${p.minPriceCr} Cr` : null, p.bhk ? `${p.bhk} BHK+` : null]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>

                {/* fit — a bar, because it is a judgement, not a measurement */}
                <div className="w-[8.5rem] shrink-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.62rem] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/35">Fit</span>
                    <span className="text-[0.8rem] font-medium text-[#1a1a1a]/75">{fit.score == null ? "—" : `${fit.score}%`}</span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#1a1a1a]/[0.08]">
                    <div
                      className={`h-full rounded-full ${(fit.score ?? 0) >= 80 ? "bg-[#1e6b45]" : (fit.score ?? 0) >= 50 ? "bg-[#9a7a2e]" : "bg-[#b0503e]"}`}
                      style={{ width: `${fit.score ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 truncate text-[0.7rem] font-light text-[#1a1a1a]/45">
                    {fit.shortMisses[0] ?? fit.reasons[0] ?? "not enough of your brief to judge"}
                  </p>
                </div>

                {/* truth score — a number, because it is one */}
                <div className="w-[4.5rem] shrink-0 text-right">
                  <p className="text-[0.62rem] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/35">Truth</p>
                  <p className="mt-0.5 font-serif text-[1.35rem] leading-none text-[#1a1a1a]">{p.truthScore ?? "—"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[0.76rem] font-light italic text-[#1a1a1a]/40">
        A 90 that doesn&rsquo;t fit you is still the wrong flat.
      </p>
    </div>
  );
}

function FounderCall() {
  return (
    <div className="mt-10 overflow-hidden rounded-xl" style={{ background: "linear-gradient(135deg,#1e6b45,#123f29)" }}>
      <div className="flex flex-col gap-5 px-7 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10">
        <div className="max-w-[46ch]">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]">Free · 15 minutes</p>
          <p className="mt-3 font-serif text-[1.35rem] font-medium leading-snug md:text-[1.6rem]">Talk it through with the founder.</p>
          <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-white/65">
            No pitch, no brokerage. Bring the shortlist you already have and we&rsquo;ll tell you what we&rsquo;d ask the developer.
          </p>
        </div>
        <Link href="/office/advice" className="shrink-0 self-start rounded-sm bg-white px-7 py-3.5 text-[0.82rem] font-medium text-[#1e6b45] transition-colors hover:bg-white/90">
          Book the call →
        </Link>
      </div>
    </div>
  );
}

/* Demoted deliberately: the visitor already knows how many reports they
   opened. It belongs on the page as context and nowhere near the top. */
function ActivityStrip({ brief }: { brief: BuyerBrief }) {
  const unlocked = brief.projects.filter((p) => p.paid).length;
  const stats = [
    { v: brief.reportsRead, l: "reports read" },
    { v: unlocked, l: "unlocked" },
    { v: brief.projects.filter((p) => p.views > 1).length, l: "returned to" },
    { v: brief.projects.filter((p) => p.enquired).length, l: "enquired" },
  ];
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-[#1a1a1a]/[0.08] pt-5">
      {stats.map((s) => (
        <p key={s.l} className="text-[0.78rem] font-light text-[#1a1a1a]/45">
          <span className="font-medium text-[#1a1a1a]/75">{s.v}</span> {s.l}
        </p>
      ))}
    </div>
  );
}

function ComingSoon() {
  const items = [
    { t: "Portfolio Tracker", b: "Pick any project, size a unit, and watch the payment schedule, ROI and current rate move together.", wide: true },
    { t: "Sun & Vastu", b: "Per-unit daylight and Vastu, across every project you're tracking." },
    { t: "Deal Room", b: "Offers, documents and the negotiation, on the record." },
    { t: "Site Visit Planner", b: "What to look at, and what to ask, before you go." },
    { t: "Price Watch", b: "We tell you when a corridor moves against your brief." },
  ];
  return (
    <div className="mt-10">
      <p className={EYEBROW}>Coming soon</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.t} className={`${CARD} px-5 py-5 ${i.wide ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center gap-2.5">
              <p className="font-serif text-[1.05rem] text-[#1a1a1a]">{i.t}</p>
              <span className="rounded-full border border-[#c9a96e]/40 px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-[#9a7a2e]">Soon</span>
            </div>
            <p className="mt-2 max-w-[52ch] text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/50">{i.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Services() {
  const svc = ["Architect", "Legal", "Home Loan", "Interiors"];
  return (
    <div className="mt-10 pb-4">
      <p className={EYEBROW}>Assisted services</p>
      <p className="mt-2 max-w-[52ch] text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">
        Independent people we&rsquo;d use ourselves. Introduced, never sold — we take nothing from either side.
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {svc.map((s) => (
          <span key={s} className="rounded-full border border-[#1a1a1a]/12 px-4 py-2 text-[0.8rem] font-light text-[#1a1a1a]/55">
            {s} <span className="text-[#1a1a1a]/30">· soon</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export { fitFor };
