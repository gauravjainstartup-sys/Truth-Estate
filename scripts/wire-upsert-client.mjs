import crypto from "node:crypto";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  // Never hardcode credentials — a committed key is a leaked key.
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
}

export function generateEventId(projectSlug, eventDate, headline) {
  const hash = crypto.createHash("sha256").update(`${projectSlug}|${eventDate}|${headline.trim()}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function naturalKey(projectSlug, eventDate, headline) {
  return `${(projectSlug || "").trim().toLowerCase()}|${(eventDate || "").trim()}|${(headline || "").trim()}`;
}

export async function fetchAllDbWires() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?select=*&limit=5000`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch existing wires from DB [${res.status}]: ${txt}`);
  }
  return await res.json();
}

/**
 * Perform a true, idempotent upsert of wire items without touching created_at,
 * and bumping updated_at only when content actually changes.
 */
export async function upsertWireBatch(incomingItems, batchName = "Batch") {
  if (!incomingItems || !incomingItems.length) {
    console.log(`[${batchName}] No items to upsert.`);
    return { inserted: 0, updated: 0, unchanged: 0 };
  }

  const dbRows = await fetchAllDbWires();
  const dbMap = new Map();
  for (const row of dbRows) {
    const key = naturalKey(row.project_slug, row.event_date, row.headline);
    dbMap.set(key, row);
    if (row.id) {
      dbMap.set(row.id, row);
    }
  }

  const toInsert = [];
  const toUpdate = [];
  let unchangedCount = 0;
  const nowIso = new Date().toISOString();

  for (const item of incomingItems) {
    const key = naturalKey(item.project_slug, item.event_date, item.headline);
    const existing = dbMap.get(key);

    if (!existing) {
      // Brand NEW item (R1 & R2: set created_at once, forever)
      const newId = item.id || generateEventId(item.project_slug, item.event_date, item.headline);
      toInsert.push({
        ...item,
        id: newId,
        status: item.status || "PUBLISHED",
        created_at: nowIso,
        updated_at: nowIso
      });
    } else {
      // Existing row: check if content actually changed (R3)
      const isDistinct =
        (item.verified_facts ?? "") !== (existing.verified_facts ?? "") ||
        (item.forensic_impact_type ?? "") !== (existing.forensic_impact_type ?? "") ||
        (item.forensic_impact_summary ?? "") !== (existing.forensic_impact_summary ?? "") ||
        (item.source_name ?? "") !== (existing.source_name ?? "") ||
        (item.source_url ?? null) !== (existing.source_url ?? null) ||
        (item.source_document_ref ?? null) !== (existing.source_document_ref ?? null) ||
        (item.status ?? "PUBLISHED") !== (existing.status ?? "PUBLISHED") ||
        Boolean(item.is_pinned) !== Boolean(existing.is_pinned) ||
        Number(item.display_order ?? 1) !== Number(existing.display_order ?? 1) ||
        (item.project_name ?? "") !== (existing.project_name ?? "");

      if (isDistinct) {
        // Content changed: update fields + bump updated_at, NEVER touch created_at (R2 & R3)
        toUpdate.push({
          ...item,
          id: existing.id,
          created_at: existing.created_at, // Preserve original creation timestamp
          updated_at: nowIso,              // Bump updated_at
          status: item.status || "PUBLISHED"
        });
      } else {
        unchangedCount++;
      }
    }
  }

  // Execute inserts in chunks if needed
  if (toInsert.length > 0) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(toInsert)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to insert new wire rows [${res.status}]: ${txt}`);
    }
  }

  // Execute updates via merge-duplicates on id
  if (toUpdate.length > 0) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(toUpdate)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to update wire rows [${res.status}]: ${txt}`);
    }
  }

  console.log(`[${batchName}] Upsert complete: ${toInsert.length} new inserted, ${toUpdate.length} updated, ${unchangedCount} unchanged.`);
  return { inserted: toInsert.length, updated: toUpdate.length, unchanged: unchangedCount };
}
