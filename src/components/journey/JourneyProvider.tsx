"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import TruthGuideBubble from "./TruthGuideBubble";
import { loadAccount, type Account, type Intent } from "@/lib/journey";
import { track } from "@/lib/events";

/* The journey modal is the single heaviest thing this provider can render —
   1,800 lines that pull in the shortlist, project profile, location picker
   (maps), the TruthGuide chat and, through it, the Supabase client. None of
   it belongs in the homepage's first paint: the modal only ever mounts after
   a deliberate CTA click (`isOpen && …` below). Loading it with next/dynamic
   splits that whole subtree into its own chunk fetched on first open, so the
   initial JS a visitor downloads drops by the modal's entire weight. ssr:false
   is safe and changes no rendered HTML — `isOpen` is false at build and on
   first paint, so the modal was never in the prerendered markup either way. */
const JourneyModal = dynamic(() => import("./JourneyModal"), { ssr: false });

type Ctx = { open: (intent?: Intent) => void; close: () => void; isOpen: boolean };

const JourneyContext = createContext<Ctx | null>(null);

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within <JourneyProvider>");
  return ctx;
}

export default function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<Intent | undefined>(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  // The Private Office is a focused, signed-in surface (and its sign-in gate):
  // keep the public "Challenge our read" advisor bubble off it.
  const pathname = usePathname();
  const inOffice = pathname?.startsWith("/office") ?? false;

  const open = (i?: Intent) => {
    setIntent(i);
    setAccount(loadAccount()); // returning-user detection
    setIsOpen(true);
    /* The requirements / buyer-brief flow just opened — one funnel event per
       start, tagged with the intent so buy vs invest vs research can be split. */
    track("requirements_flow_started", { props: { intent: i ?? "unknown" } });
  };
  const close = () => setIsOpen(false);

  // Lock body scroll while the journey is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  return (
    <JourneyContext.Provider value={{ open, close, isOpen }}>
      {children}
      {!inOffice && <TruthGuideBubble />}
      {isOpen && <JourneyModal initialIntent={intent} account={account} onClose={close} />}
    </JourneyContext.Provider>
  );
}
