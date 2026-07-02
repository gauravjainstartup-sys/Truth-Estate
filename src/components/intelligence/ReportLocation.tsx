import { pillars, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar III — Location Intelligence. A branded schematic map,
   rated nearby POIs, connectivity with travel times, and a funded-&-approved
   infrastructure timeline. Falls back gracefully where structured data
   isn't tracked yet. */

export default function ReportLocation({ p }: { p: ProjectIntel }) {
  const loc = p.ops?.location;
  const pillar = pillars(p).find((x) => x.key === "location");
  const bandChip =
    pillar?.band === "exceptional" ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.1] text-[#155a3a]"
    : pillar?.band === "strong" ? "border-[#238c55]/25 bg-[#238c55]/[0.1] text-[#1c7a4c]"
    : "border-[#9a7a2e]/30 bg-[#9a7a2e]/[0.12] text-[#8a6a1e]";

  // Real markers plotted on the schematic from tracked POIs / transit.
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
    <div className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar III · Location Intelligence</p>
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Will this address still be winning in 2035?</h3>
          <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Not just what&apos;s around it today — what&apos;s funded and coming, how you actually get in and out, and who your neighbours are.</p>
        </div>
        {pillar && <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.06em] ${bandChip}`}>◆ {pillar.band} · {pillar.score.toFixed(1)}</span>}
      </div>

      {/* schematic locality map — higher-contrast, plots real tracked POIs */}
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-[#e7eae0]">
        <svg viewBox="0 0 1024 360" preserveAspectRatio="xMidYMid slice" className="block h-[190px] w-full sm:h-[230px]" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Locality schematic — ${p.name}`}>
          <rect width="1024" height="360" fill="#e7eae0" />
          {/* green masses + built blocks */}
          <path d="M792 0 h232 v360 h-232 q-72 -180 0 -360z" fill="#c8d6b0" opacity="0.9" />
          <circle cx="92" cy="300" r="104" fill="#c8d6b0" opacity="0.9" />
          <rect x="150" y="26" width="132" height="74" rx="9" fill="#dcdfce" />
          <rect x="598" y="272" width="150" height="74" rx="9" fill="#dcdfce" />
          {/* road network — dark enough to read */}
          <g fill="none" strokeLinecap="round">
            <path d="M-40 288 Q 430 198 1064 94" stroke="#a99a78" strokeWidth="20" />
            <path d="M-40 288 Q 430 198 1064 94" stroke="#e7eae0" strokeWidth="3" strokeDasharray="12 14" opacity="0.75" />
            <path d="M404 -40 L 348 400" stroke="#c0b498" strokeWidth="10" />
            <path d="M724 -40 L 664 400" stroke="#c0b498" strokeWidth="10" />
            <path d="M-40 92 L 1064 68" stroke="#cabfa4" strokeWidth="7" />
          </g>
          {/* radius rings */}
          <g fill="none" stroke="#9a7a2e" strokeDasharray="2 10" opacity="0.42"><circle cx="470" cy="188" r="102" /><circle cx="470" cy="188" r="168" /></g>
          <text x="470" y="94" textAnchor="middle" fontSize="15" fill="#9a7a2e" opacity="0.8" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="4" paintOrder="stroke">1 km</text>
          <text x="470" y="28" textAnchor="middle" fontSize="15" fill="#9a7a2e" opacity="0.8" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="4" paintOrder="stroke">2 km</text>
          {/* arterial label */}
          {arterialName && <text x="168" y="252" fontSize="18" fontWeight="600" fill="#75694e" fontFamily="ui-sans-serif" transform="rotate(-11 168 252)" stroke="#e7eae0" strokeWidth="4.5" paintOrder="stroke">{arterialName}</text>}
          {/* real POI + transit markers */}
          {markers.map((m) => (
            <g key={m.label}>
              <circle cx={m.x} cy={m.y} r="8.5" fill={m.tone} stroke="#fff" strokeWidth="3" />
              <text x={m.anchor === "end" ? m.x - 15 : m.x + 15} y={m.y - 1} textAnchor={m.anchor} fontSize="20" fontWeight="600" fill="#3e3a2f" fontFamily="ui-sans-serif" stroke="#e7eae0" strokeWidth="4.5" paintOrder="stroke">{m.label}</text>
              <text x={m.anchor === "end" ? m.x - 15 : m.x + 15} y={m.y + 20} textAnchor={m.anchor} fontSize="15" fill="#6b6454" fontFamily="ui-monospace,monospace" stroke="#e7eae0" strokeWidth="3.5" paintOrder="stroke">{m.dist}</text>
            </g>
          ))}
          {/* project pin */}
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
        {/* POIs */}
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
        {/* connectivity */}
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

      {/* planned infrastructure */}
      {loc?.infra && loc.infra.length > 0 && (
        <>
          <div className="mt-8 flex items-center gap-3"><span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">What&apos;s coming — funded &amp; approved</span><span className="h-px flex-1 bg-[#1a1a1a]/10" /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loc.infra.map((it) => (
              <div key={it.title} className="rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-4">
                <p><span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[0.5rem] font-medium uppercase tracking-[0.06em] text-white">{it.cat}</span><span className="ml-1.5 text-[0.5rem] uppercase tracking-[0.06em] text-[#1a1a1a]/40">{it.status}</span></p>
                <h5 className="mt-2.5 text-[0.92rem] font-semibold leading-tight">{it.title}</h5>
                <p className="mt-1.5 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/55">{it.body}</p>
                <div className="mt-3 flex items-center justify-between border-t border-[#1a1a1a]/[0.06] pt-2.5">
                  <span className={`text-[0.7rem] font-semibold ${it.impact === "High" ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{it.impact === "High" ? "▲ High" : "◆ Medium"}</span>
                  <span className="font-mono text-[0.74rem] font-semibold">{it.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: tracked corridor transactions, GMDA / HSVP infrastructure plans &amp; developer filings. Map is schematic — positions indicative, not surveyed.</p>
    </div>
  );
}
