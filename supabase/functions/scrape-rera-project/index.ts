// Canonical source of the deployed `scrape-rera-project` function (previously
// existed only in the Supabase dashboard). Ship changes via
// deploy-edge-functions.yml. Fetches a HARERA project detail page, parses the
// filing tables, and upserts backlog_project_data / backlog_projects.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { DOMParser } from "npm:linkedom@0.18.5";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function txt(el) {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}
function directTds(tr) {
  const out = [];
  for (const child of Array.from(tr.children)){
    if ((child.tagName ?? "").toUpperCase() === "TD") out.push(child);
  }
  return out;
}
function allRows(doc) {
  return Array.from(doc.querySelectorAll("tr"));
}
function findRowByLabel(doc, re) {
  for (const tr of allRows(doc)){
    const tds = directTds(tr);
    if (!tds.length) continue;
    if (re.test(txt(tds[0]))) return tds;
  }
  return null;
}
function valueOfRow(tds) {
  const last = tds[tds.length - 1];
  const b = last?.querySelector("b");
  return txt(b ?? last);
}
const SQM_PER_ACRE = 4046.8564224;
const SQFT_PER_ACRE = 43560;
const HECTARE_PER_ACRE = 0.40468564224;
const UNIT_PATTERNS = [
  {
    unit: "hectare",
    re: /\b(hectares?|hect|ha)\b/i
  },
  {
    unit: "sqm",
    re: /(sq(?:uare|r)?\s*[./]?\s*m(?:t(?:r?s?)?|eter|eters|etre|etres)?\b|\bsqm\b|\bm\s*[²2]\b)/i
  },
  {
    unit: "sqft",
    re: /(sq\s*\.?\s*f(?:t|eet)?\b|\bsqft\b|\bft\s*[²2]\b)/i
  },
  {
    unit: "acre",
    re: /\b(acres?|ac)\b/i
  }
];
function parseAreaToAcres(raw, unitHint) {
  if (raw == null) return {
    raw: "",
    value: null,
    unit: "unknown",
    acres: null
  };
  const rawStr = String(raw).trim();
  if (!rawStr) return {
    raw: "",
    value: null,
    unit: "unknown",
    acres: null
  };
  let unit = "unknown";
  for (const p of UNIT_PATTERNS){
    if (p.re.test(rawStr)) {
      unit = p.unit;
      break;
    }
  }
  if (unit === "unknown" && unitHint) unit = unitHint;
  const numMatch = rawStr.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  const value = numMatch ? Number(numMatch[0]) : null;
  let acres = null;
  if (value != null && Number.isFinite(value)) {
    switch(unit){
      case "acre":
        acres = value;
        break;
      case "sqm":
        acres = value / SQM_PER_ACRE;
        break;
      case "sqft":
        acres = value / SQFT_PER_ACRE;
        break;
      case "hectare":
        acres = value / HECTARE_PER_ACRE;
        break;
      case "unknown":
        acres = value;
        break; // legacy — assume acres
    }
    if (acres != null) acres = Math.round(acres * 10000) / 10000;
  }
  return {
    raw: rawStr,
    value,
    unit,
    acres
  };
}
function parseEstimatedCost(doc) {
  const total = findRowByLabel(doc, /^\s*1\.\s*Estimated cost of the project/i);
  const land = findRowByLabel(doc, /^\s*i\.\s*Cost of the land/i);
  const construction = findRowByLabel(doc, /^\s*ii\.\s*Estimated cost of construction of apartments/i);
  const infra = findRowByLabel(doc, /^\s*iii\.\s*Estimated cost of infrastructure/i);
  const other = findRowByLabel(doc, /^\s*iv\.\s*Other Costs/i);
  if (!total) return null;
  return {
    label: "1. Estimated cost of the project",
    total: valueOfRow(total),
    breakup: {
      land: land ? valueOfRow(land) : null,
      construction: construction ? valueOfRow(construction) : null,
      infrastructure: infra ? valueOfRow(infra) : null,
      other: other ? valueOfRow(other) : null
    }
  };
}
function parseLandAreaTotal(doc) {
  const row = findRowByLabel(doc, /^\s*1\.\s*Land area of the project/i);
  if (!row) return null;
  const raw = valueOfRow(row);
  const parsed = parseAreaToAcres(raw);
  return {
    label: "1. Land area of the project",
    raw_value: parsed.raw,
    source_value: parsed.value,
    source_unit: parsed.unit,
    acres: parsed.acres
  };
}
function parseLandAreaForApartments(doc) {
  for (const tr of allRows(doc)){
    const tds = directTds(tr);
    if (tds.length < 3) continue;
    const middle = txt(tds[1]).toUpperCase();
    if (middle !== "LAND AREA TO BE USED FOR CONSTRUCTION OF APARTMENTS") continue;
    const raw = valueOfRow(tds);
    let unitHint;
    const parentTable = tr.closest?.("table");
    if (parentTable) {
      const allTableRows = Array.from(parentTable.querySelectorAll("tr"));
      const currentIdx = allTableRows.findIndex((r)=>r === tr);
      // Scan upward from the row immediately above the target
      const preceding = currentIdx > 0 ? allTableRows.slice(0, currentIdx).reverse() : [];
      for (const scanRow of preceding){
        const probe = parseAreaToAcres(txt(scanRow));
        if (probe.unit !== "unknown") {
          unitHint = probe.unit;
          break;
        }
      }
    }
    const parsed = parseAreaToAcres(raw, unitHint);
    return {
      label: "LAND AREA TO BE USED FOR CONSTRUCTION OF APARTMENTS",
      raw_value: parsed.raw,
      source_value: parsed.value,
      source_unit: parsed.unit,
      acres: parsed.acres
    };
  }
  return null;
}
function parseApprovalsNocs(doc) {
  const heading = findRowByLabel(doc, /Approvals\/\s*NOCs from various agencies for connecting external services/i);
  if (!heading) return null;
  const outerTr = heading[0].parentElement;
  if (!outerTr) return null;
  let cursor = outerTr.nextElementSibling;
  let table = null;
  while(cursor && !table){
    table = cursor.querySelector("table.table_mst");
    cursor = cursor.nextElementSibling;
  }
  if (!table) return null;
  const rows = Array.from(table.querySelectorAll("tr"));
  const out = [];
  for(let i = 1; i < rows.length; i++){
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length < 3) continue;
    out.push({
      facility: txt(cells[0]),
      agency: txt(cells[1]),
      approval_taken: txt(cells[2])
    });
  }
  return out;
}
function formatDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (!m) return s;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return s;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return `${String(d).padStart(2, "0")} ${months[mo - 1]} ${y}`;
}
function parseConstructionDates(doc) {
  const start = findRowByLabel(doc, /Likely date of starting the construction work/i);
  const complete = findRowByLabel(doc, /Likely date of completing the project/i);
  if (!start && !complete) return null;
  return {
    start_label: "i) Likely date of starting the construction work",
    start_value: start ? formatDate(valueOfRow(start)) : null,
    complete_label: "ii) Likely date of completing the project",
    complete_value: complete ? formatDate(valueOfRow(complete)) : null
  };
}
function parseApartmentsSummary(doc) {
  const heading = findRowByLabel(doc, /Type of apartments to be constructed in the project/i);
  if (!heading) return null;
  const outerTr = heading[0].parentElement;
  if (!outerTr) return null;
  let cursor = outerTr.nextElementSibling;
  let table = null;
  while(cursor && !table){
    table = cursor.querySelector("table.table_mst");
    cursor = cursor.nextElementSibling;
  }
  if (!table) return null;
  const rows = Array.from(table.querySelectorAll("tr"));
  const carpets = [];
  let maxTowers = 0;
  const detail = [];
  for(let i = 1; i < rows.length; i++){
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length < 4) continue;
    const carpet = parseFloat(txt(cells[1]));
    const towers = parseInt(txt(cells[3]), 10);
    if (!Number.isNaN(carpet)) carpets.push(carpet);
    if (!Number.isNaN(towers)) maxTowers = Math.max(maxTowers, towers);
    detail.push({
      type: txt(cells[0]),
      carpet_area: txt(cells[1]),
      apartments: txt(cells[2]),
      towers: txt(cells[3])
    });
  }
  return {
    carpet_area_min: carpets.length ? Math.min(...carpets) : null,
    carpet_area_max: carpets.length ? Math.max(...carpets) : null,
    max_towers: maxTowers || null,
    rows: detail
  };
}
function parseStatutoryApprovals(doc) {
  const heading = findRowByLabel(doc, /^\s*3\.\s*Statutory Approvals Status/i);
  if (!heading) return null;
  const outerTr = heading[0].parentElement;
  if (!outerTr) return null;
  let cursor = outerTr.nextElementSibling;
  let table = null;
  while(cursor && !table){
    table = cursor.querySelector("table.table_mst");
    cursor = cursor.nextElementSibling;
  }
  if (!table) return null;
  const rows = Array.from(table.querySelectorAll("tr"));
  const out = [];
  for(let i = 1; i < rows.length; i++){
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length < 3) continue;
    out.push({
      approval: txt(cells[0]),
      status: txt(cells[1]),
      date: txt(cells[2])
    });
  }
  return out;
}
function parseOwnerLicensee(doc) {
  const row = findRowByLabel(doc, /Is the applicant owner-licensee of the land/i);
  if (!row) return null;
  const answer = valueOfRow(row);
  const result = {
    question: "Is the applicant owner-licensee of the land for which the registration is being sought.",
    answer
  };
  if (answer.trim().toLowerCase() === "no") {
    const outerTr = row[0].parentElement;
    if (outerTr) {
      const subRows = [];
      const innerTableRows = [];
      let cursor = outerTr.nextElementSibling;
      let hops = 0;
      while(cursor && hops < 60){
        hops++;
        const tds = directTds(cursor);
        if (tds.length) {
          const lab = txt(tds[0]);
          if (/^\s*\d+\.\s/.test(lab) && !/^\s*7\./i.test(lab)) break;
          if (/I hereby declare/i.test(lab)) break;
        }
        if (tds.length >= 2) {
          const lab = txt(tds[0]);
          if (/^\s*(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b[\.\)]/i.test(lab) || /^\s*7\.\s*If the answer to the above is/i.test(lab)) {
            const val = valueOfRow(tds);
            if (lab) subRows.push({
              label: lab,
              value: val
            });
          }
        }
        const innerTable = cursor.querySelector?.("table.table_mst");
        if (innerTable) {
          const tRows = Array.from(innerTable.querySelectorAll("tr"));
          if (tRows.length > 1) {
            const headers = Array.from(tRows[0].querySelectorAll("td")).map((td)=>txt(td));
            for(let i = 1; i < tRows.length; i++){
              const cells = Array.from(tRows[i].querySelectorAll("td"));
              const obj = {};
              headers.forEach((h, idx)=>{
                obj[h || `col_${idx}`] = txt(cells[idx]);
              });
              innerTableRows.push(obj);
            }
          }
        }
        cursor = cursor.nextElementSibling;
      }
      if (subRows.length) result.sub_rows = subRows;
      if (innerTableRows.length) result.table = innerTableRows;
    }
  }
  return result;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { backlog_id, rera_url } = await req.json();
    if (!backlog_id || !rera_url) {
      return jsonResponse({
        error: "backlog_id and rera_url are required"
      }, 400);
    }
    if (!/^https?:\/\//.test(rera_url)) {
      return jsonResponse({
        error: "rera_url must be http(s)"
      }, 400);
    }
    const res = await fetch(rera_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TruthEstateBot/1.0; +https://truth-estate.local)"
      }
    });
    if (!res.ok) return jsonResponse({
      error: `Source returned ${res.status}`
    }, 502);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const estimated_cost = parseEstimatedCost(doc);
    const land_area_total = parseLandAreaTotal(doc);
    const land_area = parseLandAreaForApartments(doc);
    const approvals_nocs = parseApprovalsNocs(doc);
    const construction_dates = parseConstructionDates(doc);
    const apartments_summary = parseApartmentsSummary(doc);
    const statutory_approvals = parseStatutoryApprovals(doc);
    const owner_licensee = parseOwnerLicensee(doc);
    let open_area_pct = null;
    if (land_area_total?.acres != null && land_area?.acres != null && land_area_total.acres > 0) {
      open_area_pct = Number(((land_area_total.acres - land_area.acres) / land_area_total.acres * 100).toFixed(2));
    }
    const land_area_summary = {
      project_area_acres: land_area_total?.acres ?? null,
      construction_area_acres: land_area?.acres ?? null,
      open_area_pct
    };
    const subSectionsExtracted = [
      estimated_cost,
      land_area_total,
      land_area,
      approvals_nocs,
      construction_dates,
      apartments_summary,
      statutory_approvals,
      owner_licensee
    ].filter((v)=>v != null && (Array.isArray(v) ? v.length > 0 : true)).length;
    const step1Done = subSectionsExtracted > 0;
    const completedSteps = step1Done ? 1 : 0;
    // Key resolution matches the fleet: EDGE_DB_KEY is the revocable
    // per-consumer secret; the platform-injected SUPABASE_SERVICE_ROLE_KEY
    // fallback is the legacy JWT (dead in prod since 19 Aug 2026, still what
    // local `supabase start` injects).
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const { error: upsertErr } = await supabase.from("backlog_project_data").upsert({
      backlog_id,
      raw_html: html,
      scraped_at: new Date().toISOString(),
      estimated_cost: estimated_cost,
      land_area: {
        ...land_area_summary,
        project: land_area_total,
        for_apartments: land_area
      },
      approvals_nocs: approvals_nocs,
      construction_dates: construction_dates,
      apartments_summary: apartments_summary,
      statutory_approvals: statutory_approvals,
      owner_licensee: owner_licensee
    }, {
      onConflict: "backlog_id"
    });
    if (upsertErr) throw upsertErr;
    const newStatus = step1Done ? "wip" : "backlog";
    const { error: updErr } = await supabase.from("backlog_projects").update({
      status: newStatus,
      current_step: completedSteps
    }).eq("id", backlog_id);
    if (updErr) throw updErr;
    return jsonResponse({
      ok: true,
      completedSteps
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("scrape-rera-project failed", message);
    return jsonResponse({
      error: message
    }, 500);
  }
});
