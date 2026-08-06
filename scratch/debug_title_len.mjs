import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  const r0 = rows[0];
  console.log("Keys of r0:", Object.keys(r0));
  console.log("r0.seoSlug:", r0.seoSlug);
  console.log("r0.developer_clean:", r0.developer_clean);
  console.log("r0.project_name:", r0.project_name);
}

main().catch(console.error);
