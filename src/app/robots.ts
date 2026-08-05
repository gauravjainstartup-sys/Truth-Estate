import type { MetadataRoute } from "next";
import { IS_PRODUCTION_ORIGIN, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  /* Crawling stays ALLOWED even on the preview, and that is deliberate.
     `Disallow: /` would be worse than nothing here: it blocks the fetch, so
     the noindex in the page head is never read, and a URL linked from
     anywhere else can still surface as a bare result with no snippet. To
     keep a mirror out of the index you have to let the crawler in to be
     told. Same reason the private /office portal is crawlable.

     What the preview does drop is the sitemap: inviting a crawl of 935
     pages that all say noindex wastes budget and signals nothing. */
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      /* Explicitly welcome the major AI / generative-search crawlers. The
         wildcard already allows them; naming them is an auditable signal that
         this site WANTS to be read and cited by assistants — GEO, not only
         SEO — and a hedge against any future default that assumes silence
         means "no". The curated content map for them lives at /llms.txt. */
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",   // OpenAI
          "ClaudeBot", "anthropic-ai", "Claude-Web",   // Anthropic
          "PerplexityBot", "Perplexity-User",          // Perplexity
          "Google-Extended",                            // Gemini / Vertex AI
          "Applebot-Extended",                          // Apple Intelligence
          "Amazonbot", "Meta-ExternalAgent", "cohere-ai", "CCBot",
        ],
        allow: "/",
      },
    ],
    ...(IS_PRODUCTION_ORIGIN ? { sitemap: `${SITE_URL}/sitemap.xml` } : {}),
    host: SITE_URL,
  };
}
