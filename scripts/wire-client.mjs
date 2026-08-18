import { readFile } from "node:fs/promises";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcwMjYzMSwiZXhwIjoyMDkzMjc4NjMxfQ.imprq_CcBZ8MoVn_E26E-EmmwgC6FdNSYoc2xTgwrSI";

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
