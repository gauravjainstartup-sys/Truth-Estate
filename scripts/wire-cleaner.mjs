const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  // Never hardcode credentials — a committed key is a leaked key.
  throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required.");
}

export async function clearExistingWires() {
  console.log("Resetting project_intelligence_wire table for fresh comprehensive ingestion...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal"
    }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to clear wires [${res.status}]: ${txt}`);
  }
  console.log("✓ Table cleared successfully.");
}
