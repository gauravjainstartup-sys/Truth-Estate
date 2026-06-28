"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Logo from "../Logo";

const basePath = "/Truth-Estate";

/* ── Shared style tokens ── */
export const S = {
  section: "scroll-mt-20 pb-12 md:pb-16",
  h2: "font-serif text-[1.25rem] font-semibold leading-[1.3] text-[#1a1a1a]/85 md:text-[1.4rem]",
  body: "mt-5 space-y-4 text-[0.88rem] font-light leading-[1.85] text-[#1a1a1a]/50",
  ul: "mt-4 space-y-2.5 text-[0.88rem] font-light leading-[1.85] text-[#1a1a1a]/50",
  note: "mt-5 rounded-sm border-l-2 border-[#c9a96e]/25 py-3 pl-5 text-[0.82rem] font-light italic leading-[1.7] text-[#1a1a1a]/35",
  divider: "my-10 border-t border-[#1a1a1a]/6 md:my-14",
  link: "text-[#1a1a1a]/60 underline decoration-[#1a1a1a]/15 underline-offset-4 transition-colors hover:text-[#1a1a1a]",
};

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-[#c9a96e]/40" />
      <span>{children}</span>
    </li>
  );
}

export function Todo({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 rounded-sm border border-[#c9a96e]/20 bg-[#c9a96e]/5 px-4 py-3">
      <p className="text-[0.82rem] font-light text-[#c9a96e]/70">
        <span className="font-medium">TODO — Legal Review:</span> {children}
      </p>
    </div>
  );
}

/* ── Types ── */
type Section = { id: string; title: string };

type LegalLayoutProps = {
  title: string;
  description: string;
  breadcrumb: string;
  lastUpdated: string;
  readingTime: string;
  version: string;
  sections: Section[];
  children: ReactNode;
};

export default function LegalLayout({
  title,
  description,
  breadcrumb,
  lastUpdated,
  readingTime,
  version,
  sections,
  children,
}: LegalLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const p = scrollHeight - clientHeight;
      setProgress(p > 0 ? (scrollTop / p) * 100 : 0);
      setShowTop(scrollTop > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs: IntersectionObserver[] = [];
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(s.id); },
        { rootMargin: "-20% 0px -60% 0px" },
      );
      o.observe(el);
      obs.push(o);
    });
    return () => obs.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = useCallback(
    (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    },
    [],
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    publisher: { "@type": "Organization", name: "Truth Estate" },
    dateModified: lastUpdated,
    inLanguage: "en",
  };

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      {/* Reading progress */}
      <div
        className="fixed left-0 top-0 z-50 h-[2px] bg-gradient-to-r from-[#c9a96e] to-[#c9a96e]/50 transition-[width] duration-150 print:hidden"
        style={{ width: `${progress}%` }}
      />

      {/* Sticky nav */}
      <nav className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/95 backdrop-blur-sm print:static print:border-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <a href={basePath} aria-label="Home" className="shrink-0">
              <Logo color="#1a1a1a" className="h-7 w-auto md:h-8" />
            </a>
            <span className="hidden text-[#1a1a1a]/12 sm:inline">|</span>
            <div className="hidden items-center gap-1.5 text-[0.72rem] font-light text-[#1a1a1a]/30 sm:flex">
              <a href={basePath} className="transition-colors hover:text-[#1a1a1a]/55">
                Home
              </a>
              <span className="text-[#1a1a1a]/15">/</span>
              <span>Legal</span>
              <span className="text-[#1a1a1a]/15">/</span>
              <span className="text-[#1a1a1a]/45">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="hidden text-[0.72rem] font-light tracking-[0.04em] text-[#1a1a1a]/25 transition-colors hover:text-[#1a1a1a]/55 md:block"
            >
              Print
            </button>
            <button
              onClick={handleShare}
              className="text-[0.72rem] font-light tracking-[0.04em] text-[#1a1a1a]/25 transition-colors hover:text-[#1a1a1a]/55"
            >
              {copied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-6 pt-[7vh] md:px-10 md:pt-[9vh]">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-14 xl:grid-cols-[220px_1fr] xl:gap-16">
          <div className="hidden lg:block" />
          <header className="max-w-[680px]">
            <h1 className="font-serif text-[2rem] font-bold leading-[1.15] text-[#1a1a1a] md:text-[2.8rem]">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-[0.92rem] font-light leading-[1.8] text-[#1a1a1a]/40 md:text-[1rem]">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#1a1a1a]/6 pt-5">
              <span className="text-[0.72rem] font-light text-[#1a1a1a]/28">
                Last updated {lastUpdated}
              </span>
              <span className="hidden h-3 w-px bg-[#1a1a1a]/10 sm:block" />
              <span className="text-[0.72rem] font-light text-[#1a1a1a]/28">
                {readingTime} read
              </span>
              <span className="hidden h-3 w-px bg-[#1a1a1a]/10 sm:block" />
              <span className="text-[0.72rem] font-light text-[#1a1a1a]/28">
                Version {version}
              </span>
            </div>
          </header>
        </div>
      </div>

      {/* Trust note */}
      <div className="mx-auto mt-8 max-w-7xl px-6 md:px-10">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-14 xl:grid-cols-[220px_1fr] xl:gap-16">
          <div className="hidden lg:block" />
          <div className="max-w-[680px] border-l-2 border-[#c9a96e]/25 py-2 pl-5">
            <p className="text-[0.82rem] font-light italic leading-[1.7] text-[#1a1a1a]/30">
              We believe legal documents should be understandable. Wherever
              possible, we&apos;ve written these policies in plain English without
              changing their legal meaning.
            </p>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto mt-[5vh] max-w-7xl px-6 md:mt-[7vh] md:px-10">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-14 xl:grid-cols-[220px_1fr] xl:gap-16">
          {/* Desktop TOC */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-20">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                Contents
              </p>
              <ul className="mt-4 space-y-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollTo(s.id)}
                      className={`text-left text-[0.75rem] font-light leading-snug transition-all duration-300 ${
                        active === s.id
                          ? "translate-x-px text-[#1a1a1a]/75"
                          : "text-[#1a1a1a]/25 hover:text-[#1a1a1a]/50"
                      }`}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content column */}
          <div className="max-w-[680px]">
            {/* Mobile TOC */}
            <div className="mb-10 lg:hidden print:hidden">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="flex w-full items-center justify-between border-b border-[#1a1a1a]/8 pb-3 text-[0.82rem] font-light text-[#1a1a1a]/45"
              >
                Table of Contents
                <span className="text-[0.72rem] text-[#1a1a1a]/20">
                  {tocOpen ? "−" : "+"}
                </span>
              </button>
              {tocOpen && (
                <ul className="mt-3 space-y-2 border-b border-[#1a1a1a]/6 pb-5">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => scrollTo(s.id)}
                        className={`text-left text-[0.78rem] font-light leading-snug transition-colors ${
                          active === s.id
                            ? "text-[#1a1a1a]/65"
                            : "text-[#1a1a1a]/25"
                        }`}
                      >
                        {s.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {children}

            {/* Version history */}
            <div className="mt-[8vh] border-t border-[#1a1a1a]/6 pt-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                Version History
              </p>
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-[0.78rem] font-medium text-[#1a1a1a]/40">
                  v{version}
                </span>
                <span className="text-[0.78rem] font-light text-[#1a1a1a]/25">
                  {lastUpdated} — Initial publication
                </span>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-10 border-t border-[#1a1a1a]/6 pb-[8vh] pt-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                Questions
              </p>
              <p className="mt-4 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/40">
                If you have questions about this document, contact us at{" "}
                <a href="mailto:legal@truthestate.in" className={S.link}>
                  legal@truthestate.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[#1a1a1a]/8 bg-[#F5F0E8] text-[#1a1a1a]/25 shadow-sm transition-all duration-300 hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/55 print:hidden ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
          <path d="M12 19V5m0 0l-6 6m6-6l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
