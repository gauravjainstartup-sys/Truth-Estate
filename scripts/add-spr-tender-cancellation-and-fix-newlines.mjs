import { readFile } from "node:fs/promises";
import { upsertWireBatch } from "./wire-upsert-client.mjs";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function liveSlug(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function seoSlug(name, microMarket, location) {
  return [
    "gurugram-real-estate",
    liveSlug(name),
    liveSlug(microMarket || ""),
    liveSlug(location || "")
  ].filter(Boolean).join("-");
}

export async function run() {
  const v3 = JSON.parse(await readFile(".data-snapshot/backlog_listing_public_v3.json", "utf8"));
  const sprProjects = v3.filter(p => p.microMarket === "Southern Peripheral Road (SPR Corridor)");

  const sprItems = sprProjects.map(p => {
    const slug = seoSlug(p.name, p.microMarket, p.location);
    return {
      project_slug: slug,
      project_name: p.name,
      event_date: "2026-01-20",
      category: "INFRASTRUCTURE",
      headline: "GMDA Cancels ₹754.76 Crore Southern Peripheral Road (SPR) Elevated Corridor Tender for Redesign",
      verified_facts: "• Gurugram Metropolitan Development Authority (GMDA) formally cancelled the ₹754.76 Crore tender for the construction of an elevated corridor on Southern Peripheral Road (SPR).\n• The cancellation follows directives to redesign flyovers and underpasses to integrate with the newly approved Gurugram Metro route along the Vatika Chowk to CPR alignment.\n• Project timeline revised as GMDA prepares fresh bids to avoid structural conflicts with future mass transit pillars.",
      forensic_impact_type: "CAUTION",
      forensic_impact_summary: "Medium-term transit friction and construction delay along SPR corridor; long-term positive for integrated metro connectivity.",
      source_name: "Hindustan Times",
      source_document_ref: "HT/GGM/101780683059053",
      source_url: "https://www.hindustantimes.com/cities/gurugram-news/gmda-withdraws-tender-for-construction-of-elevated-road-on-spr-101780683059053.html",
      status: "PUBLISHED",
      is_pinned: false,
      display_order: 2
    };
  });

  console.log(`Upserting GMDA SPR Tender cancellation news across all ${sprItems.length} SPR projects...`);
  await upsertWireBatch(sprItems, "SPR Tender Cancellation Corridor-Wide Propagation");

  // Now fix any literal `\n` across all published rows in Supabase
  console.log("Fetching all published wire rows to sanitize any literal '\\n' into real newlines...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?status=eq.PUBLISHED&limit=5000`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const rows = await res.json();
  
  let fixedCount = 0;
  for (const r of rows) {
    if (r.verified_facts && r.verified_facts.includes("\\n")) {
      const cleaned = r.verified_facts.replaceAll("\\n", "\n");
      await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?id=eq.${r.id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ verified_facts: cleaned })
      });
      fixedCount++;
    }
  }
  console.log(`Cleaned literal '\\n' escaping across ${fixedCount} rows in Supabase.`);
}

run().catch(console.error);
