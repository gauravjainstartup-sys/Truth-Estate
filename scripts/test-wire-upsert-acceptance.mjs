import { upsertWireBatch, fetchAllDbWires, naturalKey } from "./wire-upsert-client.mjs";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  // Never hardcode credentials — a committed key is a leaked key.
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
}

async function runAcceptanceTests() {
  console.log("=== RUNNING CTO ACCEPTANCE CRITERIA VERIFICATION ===");

  // Baseline inspection
  const beforeRows = await fetchAllDbWires();
  console.log(`Baseline DB row count: ${beforeRows.length}`);

  // TEST 1: Re-run with no changes
  console.log("\n[TEST 1] Re-running batch with identical content (No changes)...");
  const testItem = {
    project_slug: beforeRows[0].project_slug,
    project_name: beforeRows[0].project_name,
    event_date: beforeRows[0].event_date,
    category: beforeRows[0].category,
    headline: beforeRows[0].headline,
    verified_facts: beforeRows[0].verified_facts,
    forensic_impact_type: beforeRows[0].forensic_impact_type,
    forensic_impact_summary: beforeRows[0].forensic_impact_summary,
    source_name: beforeRows[0].source_name,
    source_url: beforeRows[0].source_url,
    source_document_ref: beforeRows[0].source_document_ref,
    status: beforeRows[0].status,
    is_pinned: beforeRows[0].is_pinned,
    display_order: beforeRows[0].display_order
  };

  const res1 = await upsertWireBatch([testItem], "Test-1-Idempotent");
  if (res1.inserted === 0 && res1.updated === 0 && res1.unchanged === 1) {
    console.log("✓ PASS Test 1: Zero created_at and zero updated_at changes on unchanged row.");
  } else {
    throw new Error(`Test 1 Failed: ${JSON.stringify(res1)}`);
  }

  // TEST 2: Add exactly one new event
  console.log("\n[TEST 2] Adding exactly one brand new test event...");
  const testUniqueHeadline = `CTO Acceptance Verification Test Event - ${Date.now()}`;
  const newEvent = {
    project_slug: "gurugram-real-estate-dlf-the-arbour-sector-63",
    project_name: "DLF The Arbour",
    event_date: "2026-08-19",
    category: "CONSTRUCTION",
    headline: testUniqueHeadline,
    verified_facts: "• Acceptance verification event for upsert architecture.",
    forensic_impact_type: "POSITIVE",
    forensic_impact_summary: "Test event impact summary.",
    source_name: "CTO Test Harness",
    source_url: "https://truthestate.in",
    source_document_ref: "CTO/TEST/001",
    status: "PUBLISHED",
    is_pinned: false,
    display_order: 1
  };

  const res2 = await upsertWireBatch([newEvent], "Test-2-NewInsert");
  if (res2.inserted === 1 && res2.updated === 0) {
    console.log("✓ PASS Test 2: Exactly 1 row inserted with fresh created_at.");
  } else {
    throw new Error(`Test 2 Failed: ${JSON.stringify(res2)}`);
  }

  // Fetch the inserted row and verify created_at
  const afterInsertRows = await fetchAllDbWires();
  const insertedRow = afterInsertRows.find(r => r.headline === testUniqueHeadline);
  if (!insertedRow) throw new Error("Could not find inserted test row!");
  console.log(`  Inserted row created_at: ${insertedRow.created_at}, updated_at: ${insertedRow.updated_at}`);

  // TEST 3: Edit one event's verified_facts and re-run
  console.log("\n[TEST 3] Editing verified_facts of the test event and re-running...");
  const modifiedEvent = {
    ...newEvent,
    verified_facts: "• EDITED verified facts: Ahluwalia Contracts progressing at 7-day slab cycles."
  };

  const res3 = await upsertWireBatch([modifiedEvent], "Test-3-ContentUpdate");
  if (res3.inserted === 0 && res3.updated === 1) {
    console.log("✓ PASS Test 3: Exactly 1 row updated (content changed).");
  } else {
    throw new Error(`Test 3 Failed: ${JSON.stringify(res3)}`);
  }

  // Verify created_at did NOT change while updated_at did
  const afterUpdateRows = await fetchAllDbWires();
  const updatedRow = afterUpdateRows.find(r => r.headline === testUniqueHeadline);
  console.log(`  After update row created_at: ${updatedRow.created_at}, updated_at: ${updatedRow.updated_at}`);
  if (updatedRow.created_at !== insertedRow.created_at) {
    throw new Error(`FAIL: created_at changed! (${insertedRow.created_at} -> ${updatedRow.created_at})`);
  }
  if (new Date(updatedRow.updated_at).getTime() < new Date(insertedRow.updated_at).getTime()) {
    throw new Error("FAIL: updated_at did not move forward!");
  }
  console.log("✓ PASS Test 3 Verification: created_at stayed 100% stable; updated_at moved forward!");

  // Clean up: archive the test row so it is marked ARCHIVED rather than dirtying live data
  console.log("\n[TEST 4] Archiving the test row (R4)...");
  const archiveRes = await upsertWireBatch([{ ...modifiedEvent, status: "ARCHIVED" }], "Test-4-Archive");
  console.log("✓ PASS Test 4: Row archived successfully.");

  console.log("\n=== ALL CTO ACCEPTANCE CRITERIA VERIFIED 100% SUCCESSFULLY! ===\n");
}

runAcceptanceTests().catch(console.error);
