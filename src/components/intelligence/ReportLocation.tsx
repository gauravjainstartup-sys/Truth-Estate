import { marketOf, pillars, fmtPsf, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar III — Location Intelligence. A branded schematic map,
   rated nearby POIs, connectivity with travel times, and a funded-&-approved
   infrastructure timeline. Falls back gracefully where structured data
   isn't tracked yet. */

export default function ReportLocation({ p }: { p: ProjectIntel }) {
  const market = marketOf(p);
  const loc = p.ops?.location;
  const pillar = pillars(p).find((x) => x.key === "location");
  const bandChip =
    pillar?.band === "exceptional" ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.1] text-[#155a3a]"
    : pillar?.band === "strong" ? "border-[#238c55]/25 bg-[#238c55]/[0.1] text-[#1c7a4c]"
    : "border-[#9a7a2e]/30 bg-[#9a7a2e]/[0.12] text-[#8a6a1e]";

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

      {/* schematic map */}
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-[#edf0e6]">
        <svg viewBox="0 0 1024 300" className="block w-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="1024" height="300" fill="#edf0e6" />
          <path d="M780 0 h244 v300 h-244 q-40 -150 0 -300z" fill="#dfe7d3" />
          <circle cx="120" cy="250" r="70" fill="#e2e9d6" />
          <g stroke="#d7cdb6" strokeWidth="10" fill="none" strokeLinecap="round">
            <path d="M-20 200 Q 400 150 1040 120" /><path d="M320 -20 L 360 320" /><path d="M640 -20 L 600 320" /><path d="M-20 90 L 1040 70" strokeWidth="6" />
          </g>
          <text x="70" y="185" fontSize="11" fill="#a89e88" fontFamily="ui-monospace,monospace" transform="rotate(-4 70 185)">{(market?.name ?? "MAIN ROAD").toUpperCase()}</text>
          <g fill="none" stroke="#b9ad92" strokeDasharray="3 6" opacity=".7"><circle cx="470" cy="176" r="70" /><circle cx="470" cy="176" r="130" /></g>
          <g fontFamily="ui-sans-serif" fontSize="10.5" fill="#6b6459">
            <circle cx="430" cy="120" r="5" fill="#9a7a2e" /><text x="440" y="116">Schools · &lt;1 km</text>
            <circle cx="640" cy="150" r="5" fill="#238c55" /><text x="652" y="146">Metro (planned)</text>
          </g>
          <g transform="translate(470 176)">
            <circle r="15" fill="#9a7a2e" opacity=".18" />
            <path d="M0 -12 C 8 -12 12 -6 12 -1 C 12 6 0 16 0 16 C 0 16 -12 6 -12 -1 C -12 -6 -8 -12 0 -12 Z" fill="#9a7a2e" />
            <circle cy="-1" r="4" fill="#fff" />
          </g>
        </svg>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.68rem] text-[#5f594e] backdrop-blur"><b className="text-[#1a1a1a]">{p.name}</b>{p.ops?.address ? ` · ${p.ops.address.split(",")[0]}` : ""}</span>
          <span className="rounded-full border border-[#1a1a1a]/10 bg-white/90 px-3 py-1.5 text-[0.68rem] text-[#a89e88] backdrop-blur">Schematic · live map in report</span>
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

      {/* corridor snapshot from market */}
      {market && (
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 rounded-2xl border border-[#1a1a1a]/8 bg-white/40 p-6 md:grid-cols-4">
          <Vital v={fmtPsf(market.psf.low) + "–" + market.psf.high.toLocaleString("en-IN")} k="Price band / sq ft" />
          <Vital v={market.unitBand} k="Typical ticket" />
          <Vital v={market.appreciation3Y} k="3-yr appreciation" accent />
          <Vital v={`${market.projectCount}`} k="Projects tracked" />
        </div>
      )}
      <p className="mt-5 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: tracked corridor transactions, GMDA / HSVP infrastructure plans &amp; developer filings.</p>
    </div>
  );
}

function Vital({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[1.4rem] font-light leading-none ${accent ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>{v}</p>
      <p className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}
