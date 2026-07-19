import { pillars, type LocationGeo, type PillarBand, type ProjectIntel } from "@/lib/projects";
import LocationMaps from "./LocationMaps";

/* grade chip — same treatment as the Developer / Anatomy pillar cards */
type Band = PillarBand;
const CHIP: Record<Band, string> = {
  exceptional: "text-[#155a3a] bg-[#1e6b45]/[0.12] border-[#1e6b45]/25",
  strong: "text-[#1c7a4c] bg-[#238c55]/[0.10] border-[#238c55]/25",
  moderate: "text-[#8a6a1e] bg-[#9a7a2e]/[0.12] border-[#9a7a2e]/30",
  watch: "text-[#9a4130] bg-[#b0503e]/[0.10] border-[#b0503e]/30",
};
const DOT: Record<Band, string> = { exceptional: "bg-[#1e6b45]", strong: "bg-[#238c55]", moderate: "bg-[#9a7a2e]", watch: "bg-[#b0503e]" };
const LABEL: Record<Band, string> = { exceptional: "Exceptional", strong: "Strong", moderate: "Moderate", watch: "Watch" };
function BandChip({ band }: { band: Band }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${CHIP[band]}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${DOT[band]}`} />{LABEL[band]}
    </span>
  );
}

/* Chapter II · Pillar III — Location Intelligence. When a project carries rich
   geo data we lead with a coordinate-accurate interactive map, a connectivity
   readout with real distances & travel times, a category-score breakdown and
   the analyst's strengths/gaps. Projects not yet migrated fall back to the
   legacy branded schematic. */


export default function ReportLocation({ p }: { p: ProjectIntel }) {
  const loc = p.ops?.location;
  const geo = loc?.geo;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar III · Location Intelligence</p>
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Will this address still be winning in 2035?</h3>
          <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">What&apos;s funded and coming, what&apos;s on the ground today, and how you get around.</p>
        </div>
      </div>

      {geo ? <GeoLayout p={p} geo={geo} /> : <LegacyLayout p={p} loc={loc} />}
    </div>
  );
}

/* ══════════════════════ map-led geo layout ══════════════════════ */
function GeoLayout({ p, geo }: { p: ProjectIntel; geo: LocationGeo }) {
  const c = geo.connectivity;
  const ins = geo.insights;
  const locBand = pillars(p).find((r) => r.key === "location")?.band;

  return (
    <>
      {/* analyst assessment — same shape as the Developer cards: label + grade
         chip + the verdict; the corridor supply note rides underneath, quiet */}
      {ins?.verdict && (
        <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
          {locBand && <div className="mt-2.5"><BandChip band={locBand} /></div>}
          <p className="mt-3 font-serif text-[1.2rem] leading-[1.45] md:text-[1.3rem]">{ins.verdict}</p>
          {ins.marketStage && <p className="mt-3.5 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/55">{ins.marketStage}</p>}
        </div>
      )}

      {/* the CORE EXHIBIT — the funded pipeline answers the pillar's headline
         question, so it leads; today's ground truth follows */}
      <InfraSection infra={p.ops?.location?.infra} />

      {/* today: map + connectivity + last mile under one band */}
      <div className="mt-8 flex items-center gap-3"><span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">On the ground today</span><span className="h-px flex-1 bg-[#1a1a1a]/10" /></div>
      <LocationMaps geo={geo} projectName={p.name} slug={p.slug} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {c.metro && (
          <ConnCard icon={<IconMetro />} title={c.metro.name} sub={c.metro.line} main={`${c.metro.km} km`} tag={`${c.metro.min} min`} />
        )}
        {c.airport && (
          <ConnCard icon={<IconPlane />} title={c.airport.name} sub="via expressway" main={`${c.airport.km} km`} tag={`${c.airport.min} min`} />
        )}
        {c.roads.length > 0 && (
          <ListCard icon={<IconRoad />} title="Road access">
            {c.roads.map((r) => (
              <li key={r.name} className="py-2">
                <p className="leading-snug text-[0.78rem] text-[#1a1a1a]/75">{r.name}</p>
                <p className="mt-1 font-mono text-[0.68rem] text-[#1a1a1a]/45">{r.km} km <span className={r.type === "Direct" ? "font-semibold text-[#238c55]" : "text-[#1a1a1a]/35"}>· {r.type}</span></p>
              </li>
            ))}
          </ListCard>
        )}
        {c.business.length > 0 && (
          <ListCard icon={<IconBriefcase />} title="Business districts">
            {c.business.map((b) => (
              <li key={b.name} className="py-2">
                <p className="leading-snug text-[0.78rem] text-[#1a1a1a]/75">{b.name}</p>
                <p className="mt-1 font-mono text-[0.68rem] text-[#1a1a1a]/45">{b.km} km · {b.min} min</p>
              </li>
            ))}
          </ListCard>
        )}
      </div>

      {/* last-mile read */}
      {c.lastMile && (
        <div className="mt-4 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
          <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">The last mile — approach &amp; daily friction</span>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {c.lastMile.roadWidth && <Pill k="Road" v={c.lastMile.roadWidth} />}
            {c.lastMile.surface && <Pill k="Surface" v={c.lastMile.surface} />}
            {c.lastMile.autoCab && <Pill k="Auto / cab" v={c.lastMile.autoCab} good={/high/i.test(c.lastMile.autoCab)} />}
            {c.lastMile.bus && <Pill k="Bus" v={c.lastMile.bus} warn={/limited|low/i.test(c.lastMile.bus)} />}
            {c.lastMile.walkability && <Pill k="Walkability" v={c.lastMile.walkability} warn={/low|average/i.test(c.lastMile.walkability)} />}
            {c.lastMile.traffic && <Pill k="Peak traffic" v={c.lastMile.traffic} warn={/med|high/i.test(c.lastMile.traffic)} />}
          </div>
          {c.lastMile.bottlenecks && <p className="mt-3.5 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/55">{c.lastMile.bottlenecks}</p>}
        </div>
      )}

      {/* strengths & gaps — the balanced close */}
      {(ins?.strengths?.length || ins?.gaps?.length) && (
        <div className="mt-8 flex items-center gap-3"><span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The balance</span><span className="h-px flex-1 bg-[#1a1a1a]/10" /></div>
      )}
      {(ins?.strengths?.length || ins?.gaps?.length) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ins?.strengths?.length ? (
            <div className="rounded-2xl border border-[#1e6b45]/20 bg-[#1e6b45]/[0.04] p-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1e6b45]">✓ What the location gives you</p>
              <ul className="mt-3 space-y-2.5">
                {ins.strengths.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/70"><span className="mt-[3px] shrink-0 text-[#1e6b45]">▸</span>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {ins?.gaps?.length ? (
            <div className="rounded-2xl border border-[#9a7a2e]/25 bg-[#9a7a2e]/[0.05] p-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#9a7a2e]">△ Where to weigh trade-offs</p>
              <ul className="mt-3 space-y-2.5">
                {ins.gaps.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/70"><span className="mt-[3px] shrink-0 text-[#9a7a2e]">▸</span>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-6 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: Google Places, GMDA / HSVP corridor data &amp; our field tracking. Pins are placed from surveyed coordinates; distances are straight-line from the project and drive times vary with traffic. Pipeline items are funded or approved only — announcements without budgets don&apos;t make this list.</p>
    </>
  );
}

function ConnCard({ icon, title, sub, main, tag }: { icon: React.ReactNode; title: string; sub: string; main: string; tag: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-4">
      <span className="text-[#9a7a2e]">{icon}</span>
      <p className="mt-2.5 text-[0.86rem] font-semibold leading-tight">{title}</p>
      <p className="mt-0.5 text-[0.68rem] font-light text-[#1a1a1a]/45">{sub}</p>
      <p className="mt-auto pt-3 font-mono text-[0.9rem] font-semibold text-[#1a1a1a]">{main} <span className="text-[0.72rem] font-normal text-[#238c55]">· {tag}</span></p>
    </div>
  );
}

function ListCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-4">
      <span className="text-[#9a7a2e]">{icon}</span>
      <p className="mt-2.5 text-[0.86rem] font-semibold leading-tight">{title}</p>
      <ul className="mt-1.5 divide-y divide-dotted divide-[#1a1a1a]/10">{children}</ul>
    </div>
  );
}

function Pill({ k, v, good, warn }: { k: string; v: string; good?: boolean; warn?: boolean }) {
  const tone = good ? "text-[#1c7a4c]" : warn ? "text-[#8a6a1e]" : "text-[#1a1a1a]/70";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1a1a1a]/10 bg-white px-3 py-1.5 text-[0.72rem]">
      <span className="text-[#1a1a1a]/40">{k}</span> <b className={`font-medium ${tone}`}>{v}</b>
    </span>
  );
}

/* "What's coming — funded & approved" — the pillar's CORE EXHIBIT: the funded
   delivery pipeline as a year-railed timeline. Summary strip (counts + span)
   up top, then items grouped by landing year on a spine, each row the ledger
   line (chip · title · status · impact · month). All figures derive from the
   already-parsed items — sorted upstream by ETA, soonest first. ONE component
   for both layouts. */
type InfraItems = NonNullable<NonNullable<ProjectIntel["ops"]>["location"]>["infra"];
function InfraSection({ infra }: { infra: InfraItems }) {
  if (!infra || infra.length === 0) return null;
  const yearOf = (e: string): string | null => /(\d{4})/.exec(e)?.[1] ?? null;
  const endYearOf = (e: string): number | null => {
    const m = /(\d{4})(?:–(\d{2}))?/.exec(e);
    return m ? (m[2] ? Number(m[1].slice(0, 2) + m[2]) : Number(m[1])) : null;
  };
  // a row shows only what the rail doesn't already say: "Jun", "Now", "2027–28"
  const rowEta = (it: NonNullable<InfraItems>[number]): string => {
    if (/operational/i.test(it.status)) return "Now";
    const y = yearOf(it.eta);
    if (y && it.eta !== y && it.eta.endsWith(` ${y}`)) return it.eta.slice(0, -(y.length + 1));
    return it.eta;
  };
  const high = infra.filter((i) => i.impact === "High").length;
  const firstYear = infra.map((i) => yearOf(i.eta)).find(Boolean) ?? null;
  const endYears = infra.map((i) => endYearOf(i.eta)).filter((n): n is number => n != null);
  const lastYear = endYears.length ? Math.max(...endYears) : null;
  const groups: { year: string; items: NonNullable<InfraItems> }[] = [];
  for (const it of infra) {
    const y = yearOf(it.eta) ?? "—";
    const g = groups[groups.length - 1];
    if (g && g.year === y) g.items.push(it);
    else groups.push({ year: y, items: [it] });
  }
  return (
    <>
      <div className="mt-8 flex items-center gap-3">
        <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">What&apos;s coming — funded &amp; approved</span>
        <span className="whitespace-nowrap rounded-full border border-[#1e6b45]/35 px-2.5 py-1 font-mono text-[0.52rem] tracking-[0.12em] text-[#1e6b45]">THE CORE EXHIBIT</span>
        <span className="h-px flex-1 bg-[#1a1a1a]/10" />
      </div>

      {/* the pipeline at a glance — every figure computed from the rows below */}
      <div className="mt-3.5 flex flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-[#1a1a1a]/8 bg-white/55 px-5 py-3.5">
        <div><p className="font-serif text-[1.25rem] font-medium leading-tight">{infra.length}</p><p className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-[#1a1a1a]/45">Funded &amp; approved</p></div>
        {high > 0 && <div><p className="font-serif text-[1.25rem] font-medium leading-tight">{high}</p><p className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-[#1a1a1a]/45">High-impact</p></div>}
        {firstYear && <div><p className="font-serif text-[1.25rem] font-medium leading-tight">{firstYear}</p><p className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-[#1a1a1a]/45">First delivery</p></div>}
        {lastYear && String(lastYear) !== firstYear && <div><p className="font-serif text-[1.25rem] font-medium leading-tight">{lastYear}</p><p className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-[#1a1a1a]/45">Pipeline runs to</p></div>}
      </div>

      {/* the delivery timeline — year on the spine, rows under it */}
      <div className="mt-1.5">
        {groups.map((g, gi) => (
          <div key={g.year + g.items[0].title} className="grid grid-cols-[3.2rem_1fr] gap-x-3 lg:grid-cols-[4.6rem_1fr] lg:gap-x-6">
            <div className="relative pt-[19px]">
              <span aria-hidden className="absolute left-0 top-[25px] h-[9px] w-[9px] rounded-full bg-[#1e6b45]" />
              {gi < groups.length - 1 && <span aria-hidden className="absolute bottom-[-6px] left-[4px] top-[40px] w-px bg-[#1a1a1a]/12" />}
              <span className="pl-4 font-serif text-[0.98rem] font-medium lg:text-[1.25rem]">{g.year}</span>
            </div>
            <div className="divide-y divide-dotted divide-[#1a1a1a]/12">
              {g.items.map((it) => (
                <div key={it.title} className="py-3.5 lg:py-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span className="shrink-0 whitespace-nowrap rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[0.5rem] font-medium uppercase tracking-[0.06em] text-white">{it.cat}</span>
                    <h5 className="min-w-0 flex-1 basis-[14rem] text-[0.92rem] font-semibold leading-tight">{it.title}</h5>
                    <span className="hidden whitespace-nowrap text-[0.56rem] uppercase tracking-[0.08em] text-[#1a1a1a]/40 sm:inline">{it.status}</span>
                    <span className={`whitespace-nowrap text-[0.7rem] font-semibold ${it.impact === "High" ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{it.impact === "High" ? "▲ High" : "◆ Medium"}</span>
                    <span className="w-[4.2rem] whitespace-nowrap text-right font-mono text-[0.74rem] font-semibold tabular-nums">{rowEta(it)}</span>
                  </div>
                  {it.body && <p className="mt-1 max-w-[52rem] text-[0.74rem] font-light leading-[1.55] text-[#1a1a1a]/55 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden lg:[-webkit-line-clamp:2]">{it.body}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const svg = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", className: "h-[1.15rem] w-[1.15rem]" } as const;
const IconMetro = () => <svg {...svg} aria-hidden><rect x="6" y="4" width="12" height="12" rx="3" /><path d="M6 10h12M9 20l-2 2M15 20l2 2M9.5 16v.01M14.5 16v.01" /></svg>;
const IconPlane = () => <svg {...svg} aria-hidden><path d="M21 15.5 3 10V7l3 1 3-3 1.5.5-2 3 4 1.5 3-4 1.5.5-1.5 4L21 12z" /></svg>;
const IconRoad = () => <svg {...svg} aria-hidden><path d="M8 3 5 21M16 3l3 18M12 5v2M12 11v2M12 17v2" /></svg>;
const IconBriefcase = () => <svg {...svg} aria-hidden><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>;

/* ══════════════════════ legacy schematic (fallback) ══════════════════════ */
function LegacyLayout({ p, loc }: { p: ProjectIntel; loc: NonNullable<ProjectIntel["ops"]>["location"] }) {
  const conn = loc?.connectivity ?? [];
  const arterialName = conn.find((c) => c.direct)?.name;
  const shortLabel = (s: string) => (s.length > 18 ? s.split(/\s+/).slice(0, 2).join(" ") : s);
  const slot = [{ x: 378, y: 246 }, { x: 300, y: 120 }, { x: 722, y: 138 }, { x: 828, y: 250 }];
  const markers: { x: number; y: number; label: string; dist: string; tone: string; anchor: "start" | "end" }[] = [];
  (loc?.pois ?? []).slice(0, 2).forEach((poi, i) =>
    markers.push({ ...slot[i], label: shortLabel(poi.name), dist: poi.dist, tone: "#9a7a2e", anchor: slot[i].x > 560 ? "end" : "start" }),
  );
  const metro = conn.find((c) => /metro/i.test(c.name));
  if (metro) markers.push({ ...slot[2], label: shortLabel(metro.name), dist: metro.dist, tone: "#238c55", anchor: "end" });
  const hub = conn.find((c) => /cyber|business|hub|district|city/i.test(c.name));
  if (hub && hub !== metro) markers.push({ ...slot[3], label: shortLabel(hub.name), dist: hub.dist, tone: "#5b5346", anchor: "end" });

  return (
    <>
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-[#e7eae0]">
        <svg viewBox="0 0 1024 360" preserveAspectRatio="xMidYMid slice" className="block h-[190px] w-full sm:h-[230px]" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Locality schematic — ${p.name}`}>
          <rect width="1024" height="360" fill="#e7eae0" />
          <path d="M792 0 h232 v360 h-232 q-72 -180 0 -360z" fill="#c8d6b0" opacity="0.9" />
          <circle cx="92" cy="300" r="104" fill="#c8d6b0" opacity="0.9" />
          <rect x="150" y="26" width="132" height="74" rx="9" fill="#dcdfce" />
          <rect x="598" y="272" width="150" height="74" rx="9" fill="#dcdfce" />
          <g fill="none" strokeLinecap="round">
            <path d="M-40 288 Q 430 198 1064 94" stroke="#a99a78" strokeWidth="20" />
            <path d="M-40 288 Q 430 198 1064 94" stroke="#e7eae0" strokeWidth="3" strokeDasharray="12 14" opacity="0.75" />
            <path d="M404 -40 L 348 400" stroke="#c0b498" strokeWidth="10" />
            <path d="M724 -40 L 664 400" stroke="#c0b498" strokeWidth="10" />
            <path d="M-40 92 L 1064 68" stroke="#cabfa4" strokeWidth="7" />
          </g>
          <g fill="none" stroke="#9a7a2e" strokeDasharray="2 10" opacity="0.42"><circle cx="470" cy="188" r="102" /><circle cx="470" cy="188" r="168" /></g>
          <text x="470" y="94" textAnchor="middle" fontSize="15" fill="#9a7a2e" opacity="0.8" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="4" paintOrder="stroke">1 km</text>
          <text x="470" y="28" textAnchor="middle" fontSize="15" fill="#9a7a2e" opacity="0.8" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="4" paintOrder="stroke">2 km</text>
          {arterialName && <text x="168" y="252" fontSize="18" fontWeight="600" fill="#75694e" fontFamily="ui-sans-serif" transform="rotate(-11 168 252)" stroke="#e7eae0" strokeWidth="4.5" paintOrder="stroke">{arterialName}</text>}
          {markers.map((m) => (
            <g key={m.label}>
              <circle cx={m.x} cy={m.y} r="8.5" fill={m.tone} stroke="#fff" strokeWidth="3" />
              <text x={m.anchor === "end" ? m.x - 15 : m.x + 15} y={m.y - 1} textAnchor={m.anchor} fontSize="20" fontWeight="600" fill="#3e3a2f" fontFamily="ui-sans-serif" stroke="#e7eae0" strokeWidth="4.5" paintOrder="stroke">{m.label}</text>
              <text x={m.anchor === "end" ? m.x - 15 : m.x + 15} y={m.y + 20} textAnchor={m.anchor} fontSize="15" fill="#6b6454" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="3.5" paintOrder="stroke">{m.dist}</text>
            </g>
          ))}
          <g transform="translate(470 188)">
            <circle r="23" fill="#9a7a2e" opacity="0.16" /><circle r="13" fill="#9a7a2e" opacity="0.24" />
            <path d="M0 -18 C 12 -18 18 -8 18 -1 C 18 10 0 24 0 24 C 0 24 -18 10 -18 -1 C -18 -8 -12 -18 0 -18 Z" fill="#9a7a2e" stroke="#fff" strokeWidth="2.5" />
            <circle cy="-2" r="6" fill="#fff" />
          </g>
        </svg>
        <div className="absolute bottom-3.5 left-3.5 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.68rem] text-[#5f594e] shadow-sm backdrop-blur"><b className="text-[#1a1a1a]">{p.name}</b>{p.ops?.address ? ` · ${p.ops.address.split(",")[0]}` : ""}</span>
          <span className="rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.68rem] text-[#8a8172] shadow-sm backdrop-blur">Schematic · indicative positions</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {loc?.pois && loc.pois.length > 0 && (
          <div className="min-w-0 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
            <div className="flex items-center justify-between"><span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Who &amp; what&apos;s around · rated</span><span className="text-[0.66rem] text-[#1a1a1a]/40">within 2 km</span></div>
            <div className="mt-3">
              {loc.pois.map((poi) => (
                <div key={poi.name} className="flex items-center gap-3 border-b border-dotted border-[#1a1a1a]/12 py-3 last:border-none">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9rem] font-semibold">{poi.name}{poi.key && <span className="ml-2 rounded border border-[#9a7a2e]/40 px-1.5 py-0.5 align-middle text-[0.5rem] font-medium uppercase tracking-[0.06em] text-[#9a7a2e]">Key</span>}</p>
                    <p className="mt-0.5 text-[0.72rem] font-light text-[#1a1a1a]/45">{poi.sub}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {poi.rating != null && <p className="text-[0.82rem] font-semibold text-[#9a7a2e]">★ {poi.rating}</p>}
                    <p className="text-[0.7rem] text-[#1a1a1a]/45">{poi.dist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {loc?.connectivity && loc.connectivity.length > 0 && (
          <div className="min-w-0 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
            <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">How you get in &amp; out</span>
            <div className="mt-3">
              {loc.connectivity.map((c) => (
                <div key={c.name} className="flex items-center gap-3 border-b border-dotted border-[#1a1a1a]/12 py-3 last:border-none">
                  <span className="w-6 shrink-0 text-center text-[#9a7a2e]" aria-hidden>{c.icon}</span>
                  <div className="min-w-0 flex-1"><p className="whitespace-nowrap text-[0.85rem] font-semibold">{c.name}</p><p className="text-[0.7rem] font-light text-[#1a1a1a]/45">{c.sub}</p></div>
                  <div className="shrink-0 pl-2 text-right">
                    <p className="text-[0.82rem] font-semibold">{c.dist}</p>
                    <span className={`text-[0.56rem] font-medium uppercase tracking-[0.06em] ${c.direct ? "text-[#238c55]" : "text-[#1a1a1a]/45"}`}>{c.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <InfraSection infra={loc?.infra} />

      <p className="mt-6 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: tracked corridor transactions, GMDA / HSVP infrastructure plans &amp; developer filings. Map is schematic — positions indicative, not surveyed.</p>
    </>
  );
}
