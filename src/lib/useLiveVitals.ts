"use client";

import { useEffect, useState } from "react";

const SB_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

export type LiveVitals = {
  corridorAvg: number | null;
  currentLow: number | null;
  currentHigh: number | null;
  launchPsf: number | null;
  superAreaRange: string | null;
};

async function sbGet<T>(view: string, query: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${view}?${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function psfRange(s: string | null): [number, number] | null {
  if (!s) return null;
  const nums = (s.match(/\d+(?:[.,]\d+)?\s*k?/gi) ?? [])
    .map((t) => {
      const k = /k\s*$/i.test(t);
      const v = parseFloat(t.replace(/,/g, "").replace(/k/i, ""));
      return k || v < 100 ? v * 1000 : v;
    })
    .filter((v) => Number.isFinite(v) && v > 0);
  if (nums.length < 2) return null;
  const lo = Math.min(nums[0], nums[1]),
    hi = Math.max(nums[0], nums[1]);
  return lo > 0 && hi >= lo ? [lo, hi] : null;
}

export function useLiveVitals(projectName: string): LiveVitals | null {
  const [data, setData] = useState<LiveVitals | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await sbGet<{ id: number; avg_cost_sqft: number | null }>(
        "backlog_listing_public_v3",
        `select=id,avg_cost_sqft&name=eq.${encodeURIComponent(projectName)}&limit=1`,
      );
      if (cancelled || !rows?.length) return;
      const row = rows[0];

      const exts = await sbGet<{
        price_range_sqft: string | null;
        super_area_range: string | null;
        launch_price: number | null;
      }>(
        "project_extended_details",
        `select=price_range_sqft,super_area_range,launch_price&backlog_id=eq.${row.id}&limit=1`,
      );
      const ext = exts?.[0] ?? null;
      const range = psfRange(ext?.price_range_sqft ?? null);

      if (!cancelled) {
        setData({
          corridorAvg: row.avg_cost_sqft ?? null,
          currentLow: range?.[0] ?? null,
          currentHigh: range?.[1] ?? null,
          launchPsf: ext?.launch_price ?? null,
          superAreaRange: ext?.super_area_range ?? null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectName]);

  return data;
}
