"use client";

import { createContext, useContext, useEffect, useState } from "react";
import JourneyModal from "./JourneyModal";
import TruthGuideBubble from "./TruthGuideBubble";
import { loadAccount, type Account, type Intent } from "@/lib/journey";

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

  const open = (i?: Intent) => {
    setIntent(i);
    setAccount(loadAccount()); // returning-user detection
    setIsOpen(true);
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
      <TruthGuideBubble />
      {isOpen && <JourneyModal initialIntent={intent} account={account} onClose={close} />}
    </JourneyContext.Provider>
  );
}
