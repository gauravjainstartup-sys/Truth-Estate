"use client";

import { useEffect, useState } from "react";
import { getPackages, fetchPricing, packageById, PRICING_EVENT, type Package, type PackageId } from "@/lib/journey";

/* Live package prices for a client component. Paints immediately from the
   current overlay (the cached response, or the shipped fallback), refreshes
   from the `pricing` function on mount, and re-reads whenever the overlay
   changes — so a price or the inaugural discount edited in the database
   reaches the screen without a redeploy. The charge itself is always the
   server's, so this only ever affects what is shown. */
export function usePricing(): Package[] {
  const [pkgs, setPkgs] = useState<Package[]>(() => getPackages());
  useEffect(() => {
    let alive = true;
    void fetchPricing().then((p) => { if (alive) setPkgs(p.slice()); });
    const onUpd = () => setPkgs(getPackages().slice());
    window.addEventListener(PRICING_EVENT, onUpd);
    return () => { alive = false; window.removeEventListener(PRICING_EVENT, onUpd); };
  }, []);
  return pkgs;
}

/* One package, live. Never undefined — falls back through packageById to the
   retired list and then the first offer. */
export function usePackage(id: PackageId): Package {
  const pkgs = usePricing();
  return pkgs.find((p) => p.id === id) ?? packageById(id);
}
