/* ── chatLinks — turn TruthGuide's prose into a navigable map ───────────────
   Every tracked project, every developer we hold a page for, and every corridor
   becomes a clickable link the first time TruthGuide names it. The name→URL map
   is built from the PUBLIC omni-index the chat already loads (plus the static
   corridor list), so it leaks nothing a locked visitor couldn't already see.
   Pure + reusable: the project chat and the (coming) site-wide chat share it. */
import type { ReactNode } from "react";
import type { OmniIndex, OmniProject } from "@/lib/omni";
import { developerSlugOf } from "@/lib/projects";
import { MARKETS } from "@/lib/markets";
import { basePath } from "@/lib/site";

export type ChatLink = { name: string; href: string; kind: "project" | "developer" | "market" };

const devSlugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function buildChatLinks(projects: OmniProject[]): ChatLink[] {
  const links: ChatLink[] = [];
  const seen = new Set<string>();
  const add = (name: string | null | undefined, href: string, kind: ChatLink["kind"]) => {
    const n = (name ?? "").trim();
    if (n.length < 3) return; // skip 1–2 char noise that would match everywhere
    const k = n.toLowerCase();
    if (seen.has(k)) return; // first writer wins (projects added before developers)
    seen.add(k);
    links.push({ name: n, href, kind });
  };
  // Projects first so a name shared with a developer (e.g. a single-project
  // builder) resolves to the report, and so "DLF The Arbour" beats "DLF".
  for (const p of projects) if (p.seoSlug) add(p.name, `/projects/${p.seoSlug}`, "project");
  for (const p of projects) {
    if (!p.developer) continue;
    // Same slug the developer page is built at: the curated exception map
    // first (e.g. "Birla Estates" → "birla"), else a plain slugify — matching
    // liveDeveloperSlug(), so every tracked developer links, none 404s.
    const slug = developerSlugOf(p.developer) ?? devSlugify(p.developer);
    if (slug) add(p.developer, `/intelligence/developers/${slug}`, "developer");
  }
  for (const m of MARKETS) {
    add(m.name, `/intelligence/markets/${m.slug}`, "market");
    if (m.short && m.short !== m.name) add(m.short, `/intelligence/markets/${m.slug}`, "market");
  }
  return links;
}

/* One-shot loader for the site-wide chat (which, unlike the project chat, has
   no ProjectIntel to piggyback on). Fetches the same PUBLIC omni-index and
   caches the built link table for the session. Empty on failure — links are a
   progressive enhancement, never a blocker. */
let linkCache: ChatLink[] | null = null;
export async function loadChatLinks(): Promise<ChatLink[]> {
  if (linkCache) return linkCache;
  try {
    const res = await fetch(`${basePath}/omni-index.json`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const idx = (await res.json()) as OmniIndex;
    linkCache = buildChatLinks(idx.projects ?? []);
    return linkCache;
  } catch {
    return [];
  }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CLS: Record<ChatLink["kind"], string> = {
  project: "font-medium text-[#1e6b45] underline decoration-[#1e6b45]/30 underline-offset-2 hover:decoration-[#1e6b45]",
  developer: "font-medium text-[#9a7a2e] underline decoration-[#9a7a2e]/30 underline-offset-2 hover:decoration-[#9a7a2e]",
  market: "font-medium text-[#1a1a1a]/90 underline decoration-[#1a1a1a]/25 underline-offset-2 hover:decoration-[#1a1a1a]",
};

/* Split plain assistant text into nodes, wrapping the FIRST mention of each
   known entity in a link. Longest names are tried first ("DLF The Arbour"
   before "DLF"); word boundaries stop "SPR" matching inside "SPRING". */
export function linkify(text: string, links: ChatLink[], basePath = "", seen?: Set<string>): ReactNode[] {
  if (!text || links.length === 0) return [text];
  const uniq = [...links].sort((a, b) => b.name.length - a.name.length);
  const byName = new Map(uniq.map((l) => [l.name.toLowerCase(), l]));
  let re: RegExp;
  try {
    re = new RegExp(`\\b(${uniq.map((l) => esc(l.name)).join("|")})\\b`, "gi");
  } catch {
    return [text];
  }
  const out: ReactNode[] = [];
  // Shared across lines when rendering a multi-line answer, so an entity still
  // links on its FIRST mention only (not once per line).
  const linked = seen ?? new Set<string>();
  let last = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    const raw = m[0];
    const key = raw.toLowerCase();
    const link = byName.get(key);
    if (!link || linked.has(key)) continue; // one link per entity per message
    linked.add(key);
    if (idx > last) out.push(text.slice(last, idx));
    out.push(
      <a key={`${idx}-${key}`} href={`${basePath}${link.href}`} className={CLS[link.kind]}>
        {raw}
      </a>,
    );
    last = idx + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

/* Inline formatting inside ONE line: **bold** spans + entity links. The shared
   `seen` set keeps entity linking to the first mention across the whole answer. */
function inline(text: string, links: ChatLink[], basePath: string, seen: Set<string>): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(/(\*\*[^*\n]+\*\*)/g).forEach((part, i) => {
    if (!part) return;
    const b = part.match(/^\*\*([^*\n]+)\*\*$/);
    if (b) {
      out.push(
        <strong key={`b${i}`} className="font-semibold text-[#1a1a1a]">{linkify(b[1], links, basePath, seen)}</strong>,
      );
    } else {
      out.push(<span key={`t${i}`}>{linkify(part, links, basePath, seen)}</span>);
    }
  });
  return out;
}

/* TruthGuide replies arrive as light markdown — real newlines, "1./2./3."
   or "- " lists, and **bold** labels. The bubble used to print that raw, so
   asterisks showed and every line ran together. renderChat turns it into real
   blocks: numbered/bulleted rows keep their marker, bold renders, entity names
   still link (once). Used by both the project and the site-wide chat. */
export function renderChat(text: string, links: ChatLink[], basePath = ""): ReactNode {
  if (!text) return null;
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
  const blocks: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (!line.trim()) return; // collapse blank lines — spacing comes from the gap
    const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const bul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (num) {
      blocks.push(
        <div key={i} className="flex gap-2">
          <span className="shrink-0 font-semibold tabular-nums text-[#1e6b45]">{num[1]}.</span>
          <span className="min-w-0">{inline(num[2], links, basePath, seen)}</span>
        </div>,
      );
    } else if (bul) {
      blocks.push(
        <div key={i} className="flex gap-2">
          <span className="shrink-0 text-[#1e6b45]">•</span>
          <span className="min-w-0">{inline(bul[1], links, basePath, seen)}</span>
        </div>,
      );
    } else {
      blocks.push(<p key={i}>{inline(line, links, basePath, seen)}</p>);
    }
  });
  return <div className="space-y-2">{blocks}</div>;
}
