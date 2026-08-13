import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const start = Date.now();
  const rows = await fetchBacklogFull();
  const jsonStr = JSON.stringify(rows);
  const sizeMB = (Buffer.byteLength(jsonStr, "utf8") / (1024 * 1024)).toFixed(2);
  console.log(`Single fetchBacklogFull() returned ${rows?.length} rows, JSON size: ${sizeMB} MB in ${Date.now() - start}ms`);
}

main().catch(console.error);
