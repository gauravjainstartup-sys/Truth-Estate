/* When this build's data was baked, and how fresh it was — the anchor for
   the 6h cron's dirty probe (refresh-prod-cron.yml on main). The cron
   compares the live tables' max updated_at against maxUpdatedAt below and
   SKIPS the rebuild when nothing changed (saving the 7.4MB snapshot pull
   plus a pointless deploy), forcing one anyway once bakedAt is older than
   ~a day so stamp-less edits (backlog_project_data has no updated_at) can
   never stay unbaked forever. Emitted on every deploy like the other
   build-time JSON routes; works under SUPABASE_FIXTURES. */
import { fetchMaxStamps } from "@/lib/supabase";

export const dynamic = "force-static";

export async function GET() {
  const tables = await fetchMaxStamps();
  const maxUpdatedAt =
    Object.values(tables)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1) ?? null;
  return Response.json({ bakedAt: new Date().toISOString(), maxUpdatedAt, tables });
}
