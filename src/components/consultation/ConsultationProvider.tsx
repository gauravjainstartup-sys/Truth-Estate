"use client";

import { createContext, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ConsultContext } from "@/lib/consultation";

/* Same reasoning as the journey modal: the consultation flow only mounts on a
   deliberate "Request advice" click (`isOpen && …` below), never on first
   paint, so it has no business in the homepage's initial JS. next/dynamic
   splits it into its own chunk fetched on first open. ssr:false is safe and
   changes no rendered HTML — isOpen is false at build and first paint, so it
   was never in the prerendered markup. */
const ConsultationJourney = dynamic(() => import("./ConsultationJourney"), { ssr: false });

type Ctx = {
  openConsult: (context?: ConsultContext) => void;
  close: () => void;
  isOpen: boolean;
};

const ConsultationContext = createContext<Ctx | null>(null);

export function useConsultation() {
  const ctx = useContext(ConsultationContext);
  if (!ctx) throw new Error("useConsultation must be used within <ConsultationProvider>");
  return ctx;
}

export default function ConsultationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ConsultContext>({});

  const openConsult = (c: ConsultContext = {}) => {
    setContext(c);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  // Lock body scroll while the journey is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  return (
    <ConsultationContext.Provider value={{ openConsult, close, isOpen }}>
      {children}
      {isOpen && <ConsultationJourney context={context} onClose={close} />}
    </ConsultationContext.Provider>
  );
}
