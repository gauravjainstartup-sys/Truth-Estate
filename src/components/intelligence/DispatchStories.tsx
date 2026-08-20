"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectWireItem } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════════
   DISPATCH STORIES — News & Updates played as vertical stories.

   Same events, same words, same source refs as the list view; only the
   presentation changes. A dispatch is a discrete, dated, self-contained
   fact carrying one forensic read — which is the shape of a story card,
   so the format fits the content rather than decorating it.

   THE CONTENT IS ALL IN THE DOM, ALWAYS. Every dispatch renders as a
   real <article> with its headline, facts and read; only a transform
   moves them sideways. Nothing is fetched on advance, nothing mounts
   lazily, so a crawler — and a reader who never taps — sees the same
   text the list view would have shown. That is not incidental: the
   NewsArticle JSON-LD on the page asserts this content exists, and
   markup must never claim more than the page renders.

   THE SIGN-UP IS ITS OWN CARD, not an overlay on the last dispatch.
   It is the (n+1)th slide in the same track: same silhouette, same
   dimensions, its own surface and gold edge — a different KIND of card
   that arrives when the news runs out, rather than something that
   covers a news card up. It peeks in dimmed as you near the end, like
   any other slide. `endCard` is passed in by the caller, so this file
   owns no auth, no lead capture and no copy about either.

   Desktop: the playing card is centred with its neighbours peeking
   either side, dimmed and clickable, so the width is used and you can
   see what is coming without leaving the story. Below 900px one card
   fills the width and the neighbours sit off-view — a phone story. Same
   markup, no second code path.

   HEIGHT IS CAPPED TWO DIFFERENT WAYS, because the two layouts fail
   differently. On desktop the card is width-driven and the ratio bounds
   the height, so a viewport-height cap on the WIDTH keeps a whole
   dispatch above the fold. On a phone the card is full-bleed, so the
   column dictates the width and a fixed ratio makes the height whatever
   the handset is wide — on a large phone that was an 800px card with a
   void in the middle of it. There the height is set directly and the
   ratio is dropped.

   The ratio is 9:14, not the 9:16 a full-screen story would use. This
   is not a full-screen story: it sits in a report column under a
   section header, and the space above it is already spent.

   AUTOPLAY IS GATED ON VISIBILITY. This sits inside a long report, so
   it starts only once scrolled into view and pauses the moment it
   leaves — a player running where nobody is looking burns the reader's
   place in the story for nothing. prefers-reduced-motion turns the
   timer off entirely: the bar is drawn full and the reader advances by
   hand. The timer never runs on the sign-up card: a form that slides
   away on its own is a form nobody completes.
   ════════════════════════════════════════════════════════════════ */

/* How long a dispatch holds before advancing. Long enough to read a
   headline and its forensic read without tapping; short enough that six
   dispatches are a minute, not a sitting. */
const DUR = 7000;

/* Impact drives the scan — the card's left edge, the category chip and
   the read box all carry it, so a reader sees where the catalysts and
   the risks are before reading a word. Hex rather than Tailwind
   classes: these are painted on a deliberately dark surface that does
   not follow the page palette, and each value is interpolated into a
   per-slide style. Same semantics as the list view's IMPACT_STYLES. */
const TONE: Record<ProjectWireItem["forensicImpactType"], string> = {
  POSITIVE: "#4aa877",
  NEUTRAL: "#8c8c8c",
  CAUTION: "#d9ae62",
  RISK: "#d97a66",
};

const CAT_LABEL: Record<string, string> = {
  CONSTRUCTION: "Construction",
  REGULATORY: "Regulatory",
  INFRASTRUCTURE: "Corridor Infra",
  CORPORATE_JV: "Corporate / JV",
  PRICING: "Pricing & Sales",
  LEGAL: "Legal",
};

/* Falls back to the raw string rather than printing "Invalid Date". */
function fullDate(d: string) {
  const t = Date.parse(d);
  if (!t) return d;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* verified_facts arrives newline-separated, sometimes already bulleted
   by whoever filed it. Strip the marker so we render exactly one. */
function factLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim().replace(/^[•\-*]\s*/, ""))
    .filter(Boolean);
}

/* Every slide wears the same shell — same aspect, same corners, same
   shadow — so the sign-up sits IN the deck rather than on top of it.
   Surface and text colour are set per card, because the sign-up is
   deliberately the inverse of a dispatch: ivory among near-black. That
   is the whole signal that it is a different kind of card. */
const CARD_SHELL =
  "relative aspect-[9/14] w-[min(21rem,80vw,33vh)] shrink-0 overflow-hidden rounded-[1.4rem] shadow-[0_18px_50px_rgba(0,0,0,0.22)] " +
  "max-[899px]:aspect-auto max-[899px]:h-[min(70vh,34rem)] max-[899px]:w-full";

export default function DispatchStories({
  items,
  endCard,
  onAdvance,
  onComplete,
}: {
  items: ProjectWireItem[];
  /* The sign-up, rendered as the final card in the deck. */
  endCard?: React.ReactNode;
  /* Once per dispatch actually reached, for engagement analytics. */
  onAdvance?: (index: number, item: ProjectWireItem) => void;
  /* Once when the reader arrives at the sign-up card. */
  onComplete?: () => void;
}) {
  const n = items.length;
  /* The sign-up occupies index n — one past the last dispatch. */
  const total = n + (endCard ? 1 : 0);

  const [rawIdx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  /* The live layer swaps `items` in after mount (LiveProjectProfile), so
     the deck can get SHORTER under a reader who is already deep in the
     run. Derive the position rather than storing it: an index left
     pointing past the end would mark no slide active at all — no bars,
     no tap zones, a track with nothing playing. */
  const idx = Math.min(rawIdx, Math.max(0, total - 1));

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  /* The one bar being filled. Written to directly, sixty times a second
     — putting that fraction in state would re-render every card in the
     track on every frame. */
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const elapsedRef = useRef(0);
  const rafRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());

  const reduce = useReducedMotion();
  const onEndCard = idx >= n;

  /* ── Centre the active slide ──────────────────────────────────────
     Measured from real offsets, so the gap, a width change and the
     narrow-screen full-bleed override all come along for free rather
     than being recomputed here. */
  const layout = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    const el = slideRefs.current[idx];
    if (!vp || !track || !el) return;
    track.style.transform = `translateX(${-(el.offsetLeft + el.offsetWidth / 2 - vp.clientWidth / 2)}px)`;
  }, [idx]);

  useEffect(() => { layout(); }, [layout, total]);

  useEffect(() => {
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layout]);

  /* ── Play only while on screen ────────────────────────────────────
     Mostly-visible starts it, leaving stops it. Without this a reader
     scrolling past Chapter III would come back to find the story over.

     0.4, not 0.5: a 9:16 card is tall, and on a phone the section
     header above it eats enough of the screen that half the player is
     never on show at once — at 0.5 the story simply never started
     there. The card is capped by viewport height, so it can never be
     taller than the window and the ratio is always reachable. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting && e.intersectionRatio >= 0.4)),
      { threshold: [0, 0.4, 0.75] },
    );
    io.observe(vp);
    return () => io.disconnect();
  }, []);

  const goto = useCallback(
    (i: number) => {
      elapsedRef.current = 0;
      if (fillRef.current) fillRef.current.style.width = "0%";
      setIdx(Math.max(0, Math.min(total - 1, i)));
    },
    [total],
  );

  const advance = useCallback(() => {
    setIdx((cur) => {
      if (cur + 1 >= total) return cur;
      elapsedRef.current = 0;
      return cur + 1;
    });
  }, [total]);

  /* ── The timer ────────────────────────────────────────────────────
     One rAF loop, torn down and restarted whenever the active slide
     changes or play stops. Elapsed time lives in a ref, so resuming
     after a pause does not replay the seconds already spent. It never
     runs on the sign-up card, and reduced motion never starts it. */
  useEffect(() => {
    if (reduce || onEndCard || paused || !inView) return;
    let last = 0;
    const step = (now: number) => {
      if (!last) last = now;
      elapsedRef.current += now - last;
      last = now;
      const p = Math.min(1, elapsedRef.current / DUR);
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`;
      if (p >= 1) { advance(); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, onEndCard, paused, inView, reduce, advance]);

  /* Engagement — one event per dispatch actually reached, deduped so
     re-watching does not inflate the count, and one on arrival at the
     sign-up. */
  useEffect(() => {
    if (onEndCard || !items[idx] || seenRef.current.has(idx)) return;
    seenRef.current.add(idx);
    onAdvance?.(idx, items[idx]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, onEndCard]);

  useEffect(() => {
    if (onEndCard) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEndCard]);

  /* Arrow keys move the story only while the player holds focus — a
     report page has plenty of other things arrows should move. */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); advance(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goto(idx - 1); }
    else if (e.key === " " && !onEndCard) { e.preventDefault(); setPaused((v) => !v); }
  }

  if (!n) return null;

  /* One bar per DISPATCH. The sign-up is not a dispatch, so it does not
     get a bar; standing on it, every bar is full — the news ran out.
     `light` inverts them for the ivory sign-up card, where an ivory bar
     on ivory would be no bar at all. */
  const barsFor = (light: boolean) => (
    <div className="absolute inset-x-3 top-2.5 z-[7] flex gap-[3px]" aria-hidden>
      {items.map((_, b) => (
        <span key={b} className={`h-[2px] flex-1 overflow-hidden rounded-sm ${light ? "bg-[#1a1a1a]/15" : "bg-[#F5F0E8]/20"}`}>
          <span
            ref={b === idx && !onEndCard ? fillRef : undefined}
            className={`block h-full rounded-sm ${light ? "bg-[#1a1a1a]/55" : "bg-[#F5F0E8]"}`}
            style={{ width: b < idx || onEndCard || (b === idx && reduce) ? "100%" : "0%" }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => goto(idx - 1)}
          disabled={idx === 0}
          aria-label="Previous dispatch"
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#1a1a1a]/12 bg-white text-[#1a1a1a]/60 transition-colors hover:border-[#c9a96e] hover:text-[#1a1a1a] disabled:opacity-30 md:grid"
        >
          ←
        </button>

        <div
          ref={viewportRef}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Dispatches, played as stories"
          className="flex-1 overflow-hidden py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#9a7a2e]/40"
        >
          <div
            ref={trackRef}
            className="flex gap-6 max-[899px]:gap-0"
            style={{ transition: reduce ? "none" : "transform .42s cubic-bezier(.4,0,.2,1)", willChange: "transform" }}
          >
            {items.map((it, i) => {
              const tone = TONE[it.forensicImpactType] ?? TONE.NEUTRAL;
              const isActive = i === idx;
              const facts = factLines(it.verifiedFacts);
              return (
                <article
                  key={it.id || i}
                  ref={(el) => { slideRefs.current[i] = el; }}
                  onClick={() => { if (!isActive) goto(i); }}
                  className={`${CARD_SHELL} bg-[#0a0a0a] text-[#F5F0E8] ${isActive ? "" : "cursor-pointer opacity-[0.44] [transform:scale(0.9)]"}`}
                  style={{ transition: reduce ? "none" : "opacity .3s ease, transform .3s ease", borderLeft: `3px solid ${tone}` }}
                >
                  {isActive && barsFor(false)}

                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPaused((v) => !v); }}
                      aria-label={paused ? "Play stories" : "Pause stories"}
                      className="absolute right-3 top-[0.55rem] z-[8] grid h-6 w-6 place-items-center rounded-full bg-[#F5F0E8]/10 font-mono text-[0.55rem] text-[#F5F0E8]"
                    >
                      {paused ? "▶" : "❚❚"}
                    </button>
                  )}

                  <div className="flex h-full flex-col gap-2.5 px-5 pb-5 pt-8">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[0.6rem] tracking-wide text-[#F5F0E8]/60 max-[899px]:text-[0.72rem]">{fullDate(it.eventDate)}</span>
                      <span
                        className="rounded border px-1.5 py-px font-mono text-[0.53rem] uppercase tracking-[0.12em] max-[899px]:text-[0.62rem]"
                        style={{ borderColor: `${tone}66`, color: tone }}
                      >
                        {CAT_LABEL[it.category] || it.category}
                      </span>
                      {it.isPinned && (
                        <span className="rounded border border-[#c9a96e]/45 px-1.5 py-px font-mono text-[0.53rem] uppercase tracking-[0.12em] text-[#c9a96e] max-[899px]:text-[0.62rem]">
                          📌 Landmark
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-[1.02rem] font-medium leading-[1.24] text-white [text-wrap:balance] max-[899px]:text-[1.2rem]">
                      {it.headline}
                    </h3>

                    {facts.length > 0 && (
                      <ul className="space-y-1.5 overflow-hidden">
                        {facts.map((f, fi) => (
                          <li key={fi} className="flex gap-1.5 text-[0.68rem] leading-[1.45] text-[#F5F0E8]/70 max-[899px]:text-[0.82rem]">
                            <span aria-hidden style={{ color: tone }}>•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {it.forensicImpactSummary && (
                      <div
                        className="mt-auto shrink-0 rounded-lg border p-2.5"
                        style={{ borderColor: `${tone}40`, background: `${tone}14` }}
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-[#c9a96e] max-[899px]:text-[0.6rem]">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                          Forensic impact read
                        </div>
                        <p className="mt-1 text-[0.7rem] leading-[1.45] text-[#F5F0E8]/85 max-[899px]:text-[0.84rem]">{it.forensicImpactSummary}</p>
                      </div>
                    )}

                    {/* Above the tap zones, or the source link would be
                        covered by "next" and unclickable — and the filing
                        link is the whole point of a verified dispatch. */}
                    <div className={`relative z-[6] flex shrink-0 items-center justify-between gap-2 border-t border-[#F5F0E8]/12 pt-2 font-mono text-[0.55rem] text-[#F5F0E8]/45 max-[899px]:text-[0.64rem] ${it.forensicImpactSummary ? "" : "mt-auto"}`}>
                      <span className="truncate">{it.sourceDocumentRef ? `Ref ${it.sourceDocumentRef}` : it.sourceName}</span>
                      {it.sourceUrl && (
                        <a
                          href={it.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 text-[#c9a96e] underline-offset-2 hover:underline"
                        >
                          Verify filing ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Tap zones — the story convention. Only on the playing
                      card; a dimmed neighbour is a jump target instead. */}
                  {isActive && (
                    <>
                      <button type="button" aria-label="Previous dispatch" onClick={(e) => { e.stopPropagation(); goto(idx - 1); }} className="absolute inset-y-0 left-0 z-[5] w-1/3 cursor-default" />
                      <button type="button" aria-label="Next dispatch" onClick={(e) => { e.stopPropagation(); advance(); }} className="absolute inset-y-0 right-0 z-[5] w-2/3 cursor-default" />
                    </>
                  )}
                </article>
              );
            })}

            {/* ── The sign-up card ──────────────────────────────────
                A card of its own at the end of the deck, not a panel
                over a dispatch — and the INVERSE of one. Every dispatch
                is near-black; this is ivory. After five dark cards the
                switch is the loudest signal available that the news has
                run out and this is something else being asked of you.
                Same shell, so it still belongs to the deck. */}
            {endCard && (
              <article
                ref={(el) => { slideRefs.current[n] = el; }}
                onClick={() => { if (!onEndCard) goto(n); }}
                aria-label="Sign up for news on this project"
                /* A shade lighter than the page's own ivory: at the exact
                   page tone the card's right edge dissolves into the
                   background and it stops reading as a card at all. */
                className={`${CARD_SHELL} bg-[#FDFBF7] text-[#1a1a1a] ring-1 ring-[#1a1a1a]/[0.06] ${onEndCard ? "" : "cursor-pointer opacity-[0.44] [transform:scale(0.9)]"}`}
                style={{ transition: reduce ? "none" : "opacity .3s ease, transform .3s ease", borderLeft: "3px solid #c9a96e" }}
              >
                {onEndCard && barsFor(true)}
                <div className="flex h-full flex-col justify-center overflow-y-auto px-5 pb-5 pt-8">
                  {endCard}
                  <button
                    type="button"
                    onClick={() => { seenRef.current.clear(); goto(0); }}
                    className="mt-3 shrink-0 text-[0.7rem] text-[#1a1a1a]/45 underline-offset-4 transition-colors hover:text-[#1a1a1a] hover:underline"
                  >
                    Replay the dispatches
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={advance}
          disabled={idx >= total - 1}
          aria-label="Next dispatch"
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#1a1a1a]/12 bg-white text-[#1a1a1a]/60 transition-colors hover:border-[#c9a96e] hover:text-[#1a1a1a] disabled:opacity-30 md:grid"
        >
          →
        </button>
      </div>

      <p className="mt-3 text-center font-mono text-[0.6rem] leading-relaxed text-[#1a1a1a]/40">
        {n} dispatch{n === 1 ? "" : "es"} · tap the right of a card to advance, the left to go back · colour follows the report&rsquo;s own rule — green sound, amber watch, rust risk.
      </p>
    </div>
  );
}

/* Reads the OS setting and keeps listening: a reader who turns reduced
   motion on mid-session should not have to reload the report. */
function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}
