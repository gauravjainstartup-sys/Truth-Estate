const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Fetching all published wire rows from Supabase...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?status=eq.PUBLISHED&limit=5000`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const rows = await res.json();
  console.log(`Loaded ${rows.length} published rows.`);

  const byProject = new Map();
  for (const r of rows) {
    if (!byProject.has(r.project_slug)) {
      byProject.set(r.project_slug, []);
    }
    byProject.get(r.project_slug).push(r);
  }

  const toArchiveIds = [];

  for (const [slug, list] of byProject.entries()) {
    const byUrl = new Map();
    for (const r of list) {
      const u = r.source_url || r.source_document_ref;
      if (!u) continue;
      if (!byUrl.has(u)) {
        byUrl.set(u, []);
      }
      byUrl.get(u).push(r);
    }

    for (const [u, uRows] of byUrl.entries()) {
      if (uRows.length > 1) {
        // Prioritize the row that specifically mentions project name in headline, or has longer verified facts
        uRows.sort((a, b) => {
          const aHasName = a.headline.toLowerCase().includes((a.project_name || "").toLowerCase()) ? 1 : 0;
          const bHasName = b.headline.toLowerCase().includes((b.project_name || "").toLowerCase()) ? 1 : 0;
          if (aHasName !== bHasName) return bHasName - aHasName;
          return (b.verified_facts || "").length - (a.verified_facts || "").length;
        });

        const keeper = uRows[0];
        const dupes = uRows.slice(1);
        for (const d of dupes) {
          toArchiveIds.push(d.id);
          console.log(`[DEDUP] Archiving ID ${d.id} for ${d.project_name}: "${d.headline}" (Kept: "${keeper.headline}")`);
        }
      }
    }
  }

  console.log(`Found ${toArchiveIds.length} duplicate rows to archive.`);

  if (toArchiveIds.length > 0) {
    for (const id of toArchiveIds) {
      await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?id=eq.${id}`, {
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
    console.log(`Successfully archived all ${toArchiveIds.length} duplicate rows.`);
  }
}

run().catch(console.error);
