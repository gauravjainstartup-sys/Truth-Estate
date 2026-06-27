"use client";

import { createContext, useContext, useEffect, useState } from "react";
import ConsultationJourney from "./ConsultationJourney";
import type { ConsultContext } from "@/lib/consultation";

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
