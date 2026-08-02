"use client";

import { createContext, useContext } from "react";

/* Frozen-report mode. The sample read renders the REAL report sections, but
   as a static document inside a bottom sheet — no toggles, tabs, sliders, load-
   more or CTAs. Sections that hide content behind a control (Legal's case
   toggle, Price's ROI calculator) read this to render their full content
   inline instead, and to drop the now-dead buttons. Defaults false, so every
   live report is untouched. */
export const ReportStaticContext = createContext(false);
export const useReportStatic = () => useContext(ReportStaticContext);
