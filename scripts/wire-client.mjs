import { readFile } from "node:fs/promises";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  // Never hardcode credentials — a committed key is a leaked key.
  throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required.");
}

export async function upsertWireItems(items) {
  if (!items || !items.length) return [];
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(items)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase Insert Failed [${res.status}]: ${txt}`);
  }

  return await res.json();
}
