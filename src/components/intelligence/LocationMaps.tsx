"use client";

import { useState } from "react";
import type { LocationGeo } from "@/lib/projects";
import LocationMap from "./LocationMap";
import OsmLocationMap from "./OsmLocationMap";

/* Two views of the same verified coordinates: the real street map (OSM —
   founder req: project + POIs + live projects + expand) and the distance
   radar. Street map leads; the radar remains one tap away. */
export default function LocationMaps({ geo, projectName, slug }: { geo: LocationGeo; projectName: string; slug: string }) {
  const [view, setView] = useState<"street" | "radar">("street");
  const tab = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-[0.7rem] font-semibold transition-colors ${on ? "bg-[#0B1F1A] text-white shadow-sm" : "text-[#1a1a1a]/50 hover:text-[#1a1a1a]/80"}`;
  return (
    <div className="mt-4">
      <div className="inline-flex items-center gap-1 rounded-full border border-[#1a1a1a]/10 bg-white/70 p-1">
        <button className={tab(view === "street")} onClick={() => setView("street")}>Street map</button>
        <button className={tab(view === "radar")} onClick={() => setView("radar")}>Distance radar</button>
      </div>
      {view === "street" ? <OsmLocationMap geo={geo} projectName={projectName} slug={slug} /> : <LocationMap geo={geo} projectName={projectName} />}
    </div>
  );
}
