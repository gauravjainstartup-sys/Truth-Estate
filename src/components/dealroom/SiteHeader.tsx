"use client";

/* ════════════════════════════════════════════════════════════════
   SITE HEADER (dark) — the same menu the home hero carries, made
   reusable for the Deal Room. Logo, the site nav (Compare · Deal Room ·
   Sun & Vastu 3D · NRI Desk), a search icon, and the Sign-in / My Office
   pill on desktop; a hamburger that opens a full-screen drawer on mobile.

   The drawer renders through a portal to <body> so the Deal Room landing's
   scoped `.te-dr` CSS can't reach it. Auth is read from localStorage after
   mount (so the prerender and first client paint agree), same as AccountChip.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Logo from "@/components/Logo";
import { basePath } from "@/lib/site";
import { AUTH_EVENT, isSignedIn, loadAccount } from "@/lib/journey";

type IconProps = { className?: string };
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IconCompare = ({ className }: IconProps) => <svg className={className} {...svg}><path d="M4 8h13M13 4l4 4-4 4" /><path d="M20 16H7M11 12l-4 4 4 4" /></svg>;
const IconDealRoom = ({ className }: IconProps) => <svg className={className} {...svg}><path d="M12 4v16M8 20h8M5 8h14" /><path d="M5 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" /><path d="M19 8l-2.5 5a2.5 2.5 0 0 0 5 0Z" /></svg>;
const IconCube = ({ className }: IconProps) => <svg className={className} {...svg}><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>;
const IconGlobe = ({ className }: IconProps) => <svg className={className} {...svg}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" /></svg>;
const IconUser = ({ className }: IconProps) => <svg className={className} {...svg}><circle cx="12" cy="8.5" r="3.3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
const IconSearch = ({ className }: IconProps) => <svg className={className} {...svg}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;

const NAV = [
  { label: "Compare", href: `${basePath}/intelligence/compare`, Icon: IconCompare },
  { label: "Deal Room", href: `${basePath}/deal-room`, Icon: IconDealRoom },
  { label: "Sun & Vastu 3D", href: `${basePath}/sun-vastu`, Icon: IconCube },
  { label: "NRI Desk", href: `${basePath}/nri`, Icon: IconGlobe },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [who, setWho] = useState<string | null>(null);

  useEffect(() => {
    // localStorage doesn't exist during the prerender, so we start "signed out"
    // and correct after mount — keeps the server markup and first client paint
    // identical (same treatment as AccountChip). setState lives inside read()
    // so it isn't a synchronous setState in the effect body.
    const read = () => {
      setMounted(true);
      setWho(isSignedIn() ? (loadAccount()?.name ?? "") : null);
    };
    read();
    window.addEventListener(AUTH_EVENT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(AUTH_EVENT, read); window.removeEventListener("storage", read); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [menuOpen]);

  const firstName = (who ?? "").trim().split(/\s+/)[0] ?? "";

  return (
    // A <div>, not <header>: the Deal Room landing scopes `.te-dr header` to a
    // full-height hero, which would otherwise swallow this bar.
    <div role="banner" className="relative z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto opacity-90" /></a>

        {/* desktop nav */}
        <nav className="hidden items-center gap-7 text-[13.5px] font-medium tracking-[0.01em] text-[#f4efe6]/85 min-[900px]:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="flex items-center gap-1.5 transition-colors duration-150 hover:text-[#f4efe6]">
              <n.Icon className="h-[15px] w-[15px] shrink-0 opacity-80" />{n.label}
            </a>
          ))}
          <a href={`${basePath}/office`} className="flex items-center gap-1.5 rounded-full border border-[#c9a24b]/50 px-4 py-1.5 text-[#e7cf95] transition-colors duration-150 hover:border-[#c9a24b] hover:bg-[#c9a24b]/10">
            {mounted && who !== null
              ? <><span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#c9a24b] text-[9px] font-bold text-[#0b1a12]">{firstName.charAt(0).toUpperCase() || <IconUser className="h-[10px] w-[10px]" />}</span>{firstName || "My Office"}</>
              : <><IconUser className="h-[15px] w-[15px] shrink-0" />Sign in</>}
          </a>
        </nav>

        {/* mobile: search + hamburger */}
        <div className="flex items-center gap-4 min-[900px]:hidden">
          <a href={`${basePath}/intelligence/projects`} aria-label="Search projects" className="text-[#f4efe6]/85 transition-colors hover:text-[#f4efe6]"><IconSearch className="h-[19px] w-[19px]" /></a>
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center text-[#f4efe6]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </div>

      {mounted && menuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#14110d]">
          <div className="flex items-center justify-between px-6 py-6">
            <Logo className="h-9 w-auto" />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#f4efe6]/60 transition-colors hover:text-[#f4efe6]">Close</button>
          </div>
          <nav className="flex flex-1 flex-col justify-center gap-8 px-7">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#f4efe6]/85 transition-colors hover:text-[#f4efe6]">
                <n.Icon className="h-6 w-6 shrink-0 opacity-70" />{n.label}
              </a>
            ))}
            <a href={`${basePath}/intelligence/projects`} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#f4efe6]/85 transition-colors hover:text-[#f4efe6]">
              <IconSearch className="h-6 w-6 shrink-0 opacity-70" />Search
            </a>
            <a href={`${basePath}/office`} className="flex items-center gap-4 font-serif text-[2rem] font-light text-[#e7cf95]">
              {mounted && who !== null
                ? <><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#c9a24b] text-[11px] font-bold text-[#0b1a12]">{firstName.charAt(0).toUpperCase() || <IconUser className="h-3 w-3" />}</span>{firstName || "My Office"}</>
                : <><IconUser className="h-6 w-6 shrink-0 opacity-80" />Sign in</>}
            </a>
          </nav>
        </div>,
        document.body,
      )}
    </div>
  );
}
