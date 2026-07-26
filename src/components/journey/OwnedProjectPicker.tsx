"use client";

/* ════════════════════════════════════════════════════════════════
   "Which project did you book?" — the owner path's only question.

   Our catalogue first; Google Places only once our catalogue has said
   no. That ordering is not a nicety — it is what keeps the Places bill
   proportional to genuine misses rather than to keystrokes, and it is
   the same rule LocationPicker already follows for areas.

   There is always a way forward. If Places confirms, they pick a
   candidate; if it finds nothing, or is blocked, or has no key, the
   escape line still submits what they typed. Nobody is turned away
   because an API did not recognise their building.

   Rendering only — the searching, the confirming and the two
   destinations live in lib/ownerFlow.ts.
   ════════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MIN_CONFIRM_CHARS,
  confirmWithPlaces,
  searchTracked,
  trackedProjects,
  type PlaceCandidate,
} from "@/lib/ownerFlow";
import type { OmniProject } from "@/lib/omni";

type Phase = "idle" | "checking" | "checked";

export default function OwnedProjectPicker({
  onFound,
  onUnlisted,
}: {
  onFound: (p: OmniProject) => void;
  onUnlisted: (name: string, place: PlaceCandidate | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<OmniProject[] | null>(null);
  /* The answer is stored WITH the question it answers. Keeping them apart
     meant an effect had to clear the old hits whenever the query changed,
     and between the keystroke and that clear the panel showed one query's
     candidates under another query's heading. */
  const [confirmed, setConfirmed] = useState<{ q: string; hits: PlaceCandidate[] } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let alive = true;
    void trackedProjects().then((p) => { if (alive) setProjects(p ?? []); });
    return () => { alive = false; };
  }, []);

  const q = query.trim();
  const results = useMemo(
    () => (projects && q.length >= 2 ? searchTracked(q, projects) : []),
    [q, projects],
  );

  /* Places runs only on a genuine miss: our catalogue answered, it
     answered nothing, and there is enough of a name to look up. */
  const shouldConfirm = projects !== null && results.length === 0 && q.length >= MIN_CONFIRM_CHARS;

  const answered = confirmed?.q === q;
  const places = answered ? confirmed!.hits : [];
  const phase: Phase = !shouldConfirm ? "idle" : answered ? "checked" : "checking";

  useEffect(() => {
    if (!shouldConfirm || answered) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setConfirmed({ q, hits: await confirmWithPlaces(q) });
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [q, shouldConfirm, answered]);

  const showPanel = q.length >= 2 && projects !== null;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing the project name…"
        autoComplete="off"
        aria-label="Project name"
        className="w-full truncate border-b-2 border-[#1a1a1a]/15 bg-transparent py-4 font-serif text-[1.1rem] font-light text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/30 focus:border-[#1e6b45]/50 md:text-[1.35rem]"
      />

      {showPanel && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#1a1a1a]/12 bg-[#F5F0E8]">
          {results.length > 0 ? (
            results.map((p) => (
              <button
                key={p.slug}
                onClick={() => onFound(p)}
                className="flex w-full items-center justify-between gap-3 border-b border-[#1a1a1a]/[0.06] px-5 py-3.5 text-left transition-colors duration-200 last:border-b-0 hover:bg-[#1e6b45]/[0.06]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-serif text-[1.02rem] font-light text-[#1a1a1a]/85">
                    {p.name}
                  </span>
                  {p.location && (
                    <span className="mt-0.5 block truncate text-[0.76rem] font-light text-[#1a1a1a]/45">
                      {p.location}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-[#1e6b45]/10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[#1e6b45]">
                  Covered
                </span>
              </button>
            ))
          ) : (
            <>
              <p className="px-5 pb-1 pt-4 text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/70">
                We don&rsquo;t cover <b className="font-medium text-[#1a1a1a]">{q}</b> yet.
              </p>

              {phase === "checking" && (
                <p className="px-5 pb-4 pt-1.5 text-[0.82rem] font-light text-[#1a1a1a]/40">Checking&hellip;</p>
              )}

              {phase === "checked" && places.length > 0 && (
                <>
                  <p className="px-5 pb-2 pt-1.5 text-[0.82rem] font-light text-[#1a1a1a]/45">Is this it?</p>
                  {places.map((c) => (
                    <button
                      key={c.placeId}
                      onClick={() => onUnlisted(c.name, c)}
                      className="flex w-full items-center justify-between gap-3 border-t border-[#1a1a1a]/[0.06] px-5 py-3.5 text-left transition-colors duration-200 hover:bg-[#9a7a2e]/[0.07]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-[1.02rem] font-light text-[#1a1a1a]/85">
                          {c.name}
                        </span>
                        {c.address && (
                          <span className="mt-0.5 block truncate text-[0.76rem] font-light text-[#1a1a1a]/45">
                            {c.address}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[0.78rem] font-light text-[#9a7a2e]">Confirm</span>
                    </button>
                  ))}
                </>
              )}

              {/* The escape. Present whatever Places said — including when
                  it offered candidates and none of them is right. */}
              {(phase === "checked" || q.length < MIN_CONFIRM_CHARS) && (
                <button
                  onClick={() => onUnlisted(q, null)}
                  className="w-full border-t border-[#1a1a1a]/[0.06] px-5 py-3.5 text-left text-[0.88rem] font-light text-[#1e6b45] transition-colors duration-200 hover:bg-[#1e6b45]/[0.06]"
                >
                  {places.length > 0 ? "None of these — use what I typed" : "Send it to us anyway"} &rarr;
                </button>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-6 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/40">
        {projects === null
          ? "Loading the projects we track…"
          : `We research ${projects.length} Gurugram projects. If yours isn't one of them, we'll research it.`}
      </p>
    </div>
  );
}
