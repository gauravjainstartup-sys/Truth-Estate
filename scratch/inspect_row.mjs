import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  if (rows.length > 0) {
    console.log("Keys in row 0:", Object.keys(rows[0]));
    console.log("Row 0 sample:", rows[0]);
  }
}

main().catch(console.error);
