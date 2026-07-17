/* Build-emitted omni index: the same OmniIndex the /intelligence page
   renders from, published as a static file so the omni-router Edge
   Function (and any future consumer) reasons over identical rows.
   Refreshed on every deploy, like /search-index.json. */
import { buildIndex } from "@/lib/omniIndex";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildIndex());
}
