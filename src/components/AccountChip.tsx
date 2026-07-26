"use client";

/* ════════════════════════════════════════════════════════════════
   Who is reading this — and the only way to stop being them.

   The report header showed a logo, a search and a BACK, and nothing at
   all about the account. That is the page where the question matters
   most: it is the page behind the paywall, so "am I signed in" is the
   same question as "why can I see this".

   Signed out it is a sign-in link. Signed in it is an initial, and
   tapping it opens the account: which number, the office, and sign out.
   Sign out did not exist anywhere in the product until now.

   Mirrors the homepage header's treatment (icon + "Sign in", or an
   initial) so the two read as one site — deliberately a separate
   component rather than a change to that one, which is not what was
   asked for.
   ════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { AUTH_EVENT, isSignedIn, loadAccount, signOut } from "@/lib/journey";
import { getSession } from "@/lib/phoneAuth";

const basePath = "/Truth-Estate";

function maskPhone(p: string | null | undefined): string {
  const d = (p ?? "").replace(/\D/g, "");
  return d.length >= 4 ? `·····${d.slice(-4)}` : "Signed in";
}

export default function AccountChip({
  onSignIn,
  className = "",
}: {
  onSignIn?: () => void;
  className?: string;
}) {
  /* Auth is localStorage, which does not exist during the prerender.
     Starting as "signed out" and correcting after mount is what keeps
     the server's markup and the client's first render identical. */
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState<{ name: string; phone: string | null } | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => {
      setReady(true);
      setWho(isSignedIn() ? { name: loadAccount()?.name ?? "", phone: getSession()?.phone ?? null } : null);
    };
    read();
    /* AUTH_EVENT for signing in or out on this page, `storage` for doing
       it in another tab — a header still offering "Sign in" to someone
       who just signed in is how this went unnoticed for so long. */
    window.addEventListener(AUTH_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(AUTH_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  /* Render nothing until we know, rather than flashing "Sign in" at
     someone who is signed in. */
  if (!ready) return <span className={`inline-block h-8 w-8 ${className}`} aria-hidden />;

  if (!who) {
    return onSignIn ? (
      <button
        onClick={onSignIn}
        className={`inline-flex items-center gap-1.5 text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a] ${className}`}
      >
        <UserIcon className="h-[15px] w-[15px]" />
        <span className="hidden sm:inline">SIGN IN</span>
      </button>
    ) : (
      <a
        href={`${basePath}/office`}
        className={`inline-flex items-center gap-1.5 text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a] ${className}`}
      >
        <UserIcon className="h-[15px] w-[15px]" />
        <span className="hidden sm:inline">SIGN IN</span>
      </a>
    );
  }

  const initial = (who.name.trim().charAt(0) || "•").toUpperCase();

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        className="grid h-8 w-8 place-items-center rounded-full bg-[#1e6b45] text-[12px] font-bold text-white transition-opacity hover:opacity-85"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#1a1a1a]/12 bg-[#F5F0E8] shadow-[0_20px_50px_-24px_rgba(26,26,26,0.5)]"
        >
          <div className="border-b border-[#1a1a1a]/[0.07] px-4 py-3">
            <p className="text-[0.62rem] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Signed in</p>
            <p className="mt-1 truncate font-serif text-[0.98rem] text-[#1a1a1a]">
              {who.name.trim() || maskPhone(who.phone)}
            </p>
            {who.name.trim() && who.phone && (
              <p className="mt-0.5 text-[0.76rem] font-light text-[#1a1a1a]/45">{maskPhone(who.phone)}</p>
            )}
          </div>
          <a
            role="menuitem"
            href={`${basePath}/office`}
            className="block px-4 py-3 text-[0.88rem] font-light text-[#1a1a1a]/75 transition-colors hover:bg-[#1e6b45]/[0.06]"
          >
            My Office
          </a>
          <button
            role="menuitem"
            onClick={() => { signOut(); setOpen(false); }}
            className="block w-full border-t border-[#1a1a1a]/[0.07] px-4 py-3 text-left text-[0.88rem] font-light text-[#b0503e] transition-colors hover:bg-[#b0503e]/[0.06]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
