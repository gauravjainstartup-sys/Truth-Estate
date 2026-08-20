const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Fetching all published wire rows from Supabase...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?status=eq.PUBLISHED&limit=5000`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const rows = await res.json();
  console.log(`Loaded ${rows.length} published rows.`);

  const toArchive = rows.filter(r => {
    const cat = (r.category || "").toUpperCase();
    const sName = (r.source_name || "").toLowerCase();
    const sUrl = (r.source_url || "").toLowerCase();
    const sRef = (r.source_document_ref || "").toLowerCase();

    return cat === "REGULATORY" ||
           sName.includes("harera") ||
           sName.includes("rera") ||
           sUrl.includes("haryanarera.gov.in") ||
           sRef.includes("rc/rep/harera");
  });

  console.log(`Identified ${toArchive.length} Regulatory / RERA rows to archive.`);

  for (const r of toArchive) {
    console.log(`[ARCHIVING RERA/REGULATORY] ID: ${r.id} | ${r.project_name} | "${r.headline}"`);
    await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?id=eq.${r.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ status: "ARCHIVED" })
    });
  }

  console.log(`Successfully archived all ${toArchive.length} Regulatory / RERA rows.`);
}

run().catch(console.error);
