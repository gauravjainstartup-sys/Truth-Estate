import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  console.log("Row 0 all properties:", JSON.stringify(rows[0], null, 2));
}

main().catch(console.error);
