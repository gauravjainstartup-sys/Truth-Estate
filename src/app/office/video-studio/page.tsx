"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

type VideoScript = {
  slug: string;
  projectName: string;
  developer: string;
  location: string;
  truthScore: number;
  scoreTag: string;
  price: string;
  cagr: string;
  deliveryYear: number;
  delayRisk: string;
  redFlags: number;
  youtubeShortScript: {
    durationSeconds: number;
    sections: { timestamp: string; title: string; narration: string; visual: string }[];
  };
  youtubeExplainerScript: {
    durationSeconds: number;
    title: string;
    description: string;
    sections: { title: string; text: string }[];
  };
};

const DEFAULT_ELIE_SAAB_SCRIPT: VideoScript = {
  slug: "m3m-elie-saab",
  projectName: "M3M Elie Saab Branded Residences",
  developer: "M3M India & Smartworld",
  location: "Golf Course Extension Road, Sector 65, Gurugram",
  truthScore: 82,
  scoreTag: "Strong",
  price: "₹12.30 Cr",
  cagr: "11.9%",
  deliveryYear: 2028,
  delayRisk: "Moderate",
  redFlags: 2,
  youtubeShortScript: {
    durationSeconds: 60,
    sections: [
      {
        timestamp: "0:00-0:10",
        title: "Intro Hook",
        narration: "Is M3M Elie Saab in Sector 65 Gurugram worth twelve crore rupees? Let’s examine the independent forensic data.",
        visual: "Elie Saab render + Truth Score 82/100 badge overlay"
      },
      {
        timestamp: "0:10-0:25",
        title: "Brand & Price Audit",
        narration: "Starting at ₹12.30 Cr, this haute couture branded residence offers an 11.9% projected 5-year CAGR, featuring Elie Saab interior architecture and private lift access.",
        visual: "Interior marble render + 11.9% CAGR chart"
      },
      {
        timestamp: "0:25-0:40",
        title: "Legal & Delay Risk",
        narration: "Target delivery is 2028. While brand prestige is exceptional, developer litigation risk is flagged for review. Verify HRERA escrow accounts before booking.",
        visual: "Construction progress timeline + 2 Red Flags badge"
      },
      {
        timestamp: "0:40-1:00",
        title: "Final Verdict",
        narration: "M3M Elie Saab earns a Truth Score of 82/100 — a trophy asset for HNIs with clear legal checks. Get the full 150-point audit at Truth Estate.",
        visual: "Final verdict card + CTA overlay"
      }
    ]
  },
  youtubeExplainerScript: {
    durationSeconds: 180,
    title: "M3M Elie Saab Gurugram Review & Audit | Truth Score 82/100",
    description: "Full forensic audit of M3M Elie Saab Branded Residences in Golf Course Extension Road, Sector 65, Gurugram. RERA HRERA-GGM-671-2023. Truth Score 82/100.",
    sections: [
      { title: "Project Overview", text: "Parisian haute-couture branded residences by Elie Saab and M3M India in Sector 65, Golf Course Extension Road." },
      { title: "Financial & Price Analysis", text: "Starting price of ₹12.30 Cr with 11.9% projected 5-year CAGR." },
      { title: "Construction & Delivery Audit", text: "Target delivery 2028 with 14.8 months portfolio delay buffer." },
      { title: "Legal & Title Audit", text: "RERA registered under HRERA-GGM-671-2023. Litigation flags noted on developer entity." },
      { title: "Verdict & Buyer Checklist", text: "Truth Score 82/100. Recommended for HNIs seeking brand equity with verified BBA delay clauses." }
    ]
  }
};

const DEFAULT_ELIE_SAAB_MD = `# FORENSIC REPORT: M3M Elie Saab Branded Residences by M3M India & Smartworld
**Location:** Golf Course Extension Road, Sector 65, Gurugram
**Truth Score:** 82/100 (Strong / Ultra-Luxury HNI Tier)
**Starting Price:** ₹12.30 Cr | **5-Year Projected CAGR:** 11.9%
**RERA Registration:** HRERA-GGM-671-2023
**Configuration:** 3.5 & 4.5 BHK Luxury Residences | **Target Delivery:** 2028

---

## EXECUTIVE VERDICT
M3M Elie Saab is one of Gurugram’s most high-profile international haute-couture branded residences. Designed in collaboration with Parisian fashion house Elie Saab, it targets Ultra-HNIs seeking bespoke interior architecture, private lift lobbies, and high-street retail access along Golf Course Extension Road. At an entry price of ₹12.30 Cr, it combines high brand prestige with an 11.9% expected 5-year appreciation CAGR.

---

## 1. BRAND & ARCHITECTURAL HIGHLIGHTS
- **Elie Saab Brand Licensing:** International haute couture interior design specifications, imported Italian marble, custom brass accents, and branded lobby furniture.
- **Consultant Constellation:** Global architecture and landscape design by internationally acclaimed award-winning firms.
- **Clubhouse & Amenities:** 32,000 sq.ft. private clubhouse with glass-enclosed, climate-controlled infinity pool, private dining suites, and concierge valet.

## 2. FINANCIAL & PRICE ANALYSIS
- **Starting Price:** ₹12.30 Cr
- **5-Year Projected CAGR:** 11.9%
- **Average Price per Sq.Ft:** ₹21,550 / sq.ft
- **PSF Comparison:** Positioned at a premium over non-branded Sector 65 developments, justified by brand equity and international finishes.

## 3. CONSTRUCTION & DELAY RISK AUDIT
- **Promised Delivery Year:** 2028
- **Construction Progress:** Phase-1 foundation and structural podium casting in progress.
- **Delay Risk Assessment:** Tracked delay risk is Moderate (historical developer delay average: 14.8 months across portfolio).

## 4. LEGAL & TITLE SAFETY AUDIT
- **RERA ID:** HRERA-GGM-671-2023
- **Litigation Status:** Litigation risk rated HIGH on developer entity; buyers are advised to conduct independent title and escrow account verification before signing BBA.
- **Red Flags Identified:** 2 items flagged for buyer review (including delay buffer provisions and maintenance deposit terms).

## 5. BUYER DECISION CHECKLIST & QUESTIONS TO ASK
- **Verdict:** Proceed with Caution — High brand equity and trophy asset potential for self-use/HNIs, but requires strict RERA escrow verification and delay penalty clauses.
- **5 Critical Questions for Builder Sales Desk:**
  1. Is the Elie Saab interior package fully included in the base price, or billed as a separate fit-out package?
  2. What is the contractually binding penalty per sq.ft per month if handover extends past 2028?
  3. What is the specific HRERA Escrow Account number dedicated to the Elie Saab phase?
  4. What are the fixed maintenance charges per sq.ft for the Elie Saab concierge services?
  5. What is the exact carpet area efficiency percentage vs super built-up area?
`;

const INITIAL_PROJECTS = [
  { slug: "m3m-elie-saab", name: "M3M Elie Saab Branded Residences", dev: "M3M & Smartworld", score: 82 },
  { slug: "elan-the-presidential", name: "Elan The Presidential", dev: "Elan Group", score: 84 },
  { slug: "dlf-the-arbour", name: "DLF The Arbour", dev: "DLF India", score: 89 },
  { slug: "godrej-meridien-grandeur-phase-2", name: "Godrej Meridien Grandeur", dev: "Godrej Properties", score: 81 },
  { slug: "smart-world-one-dxp", name: "Smartworld One DXP", dev: "Smartworld", score: 79 },
  { slug: "godrej-miraya", name: "Godrej Miraya", dev: "Godrej Properties", score: 83 },
  { slug: "m3m-golf-hills-phase-1", name: "M3M Golf Hills", dev: "M3M India", score: 77 },
];

export default function VideoStudioPage() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedSlug, setSelectedSlug] = useState<string>("m3m-elie-saab");
  const [script, setScript] = useState<VideoScript | null>(DEFAULT_ELIE_SAAB_SCRIPT);
  const [notebookMd, setNotebookMd] = useState<string>(DEFAULT_ELIE_SAAB_MD);
  const [copied, setCopied] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [tab, setTab] = useState<"player" | "notebooklm" | "short">("player");
  const [loading, setLoading] = useState<boolean>(false);

  // Live Video Player / Exporter State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSec, setActiveSec] = useState<number>(0);
  const [audioSrc, setAudioSrc] = useState<string>("/youtube-assets/audio/m3m-elie-saab.mp3");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch(`/compare-index.json`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.projects || []).map((p: any) => ({
            slug: p.slug,
            name: p.name,
            dev: p.developer || "Gurugram Developer",
            score: p.score || 75,
          }));
          if (list.length > 0) setProjects(list);
        }
      } catch {
        // Keeps INITIAL_PROJECTS
      }
    }
    loadManifest();
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    if (selectedSlug === "m3m-elie-saab") {
      setScript(DEFAULT_ELIE_SAAB_SCRIPT);
      setNotebookMd(DEFAULT_ELIE_SAAB_MD);
      setAudioSrc("/youtube-assets/audio/m3m-elie-saab.mp3");
      return;
    }

    setLoading(true);
    setCopied(false);
    setIsPlaying(false);
    setActiveSec(0);

    async function fetchAssets() {
      try {
        const [scriptRes, mdRes] = await Promise.all([
          fetch(`/youtube-assets/scripts/${selectedSlug}.json`),
          fetch(`/youtube-assets/notebooklm/${selectedSlug}.md`),
        ]);
        if (scriptRes.ok) setScript(await scriptRes.json());
        if (mdRes.ok) setNotebookMd(await mdRes.text());
        setAudioSrc(`/youtube-assets/audio/${selectedSlug}.mp3`);
      } catch (e) {
        console.error("Failed to load video assets", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [selectedSlug]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.dev.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyNotebook = () => {
    if (!notebookMd) return;
    navigator.clipboard.writeText(notebookMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || !script) return;
    const time = audioRef.current.currentTime;
    if (time < 10) setActiveSec(0);
    else if (time < 25) setActiveSec(1);
    else if (time < 40) setActiveSec(2);
    else setActiveSec(3);
  };

  return (
    <div className="min-h-screen bg-[#0d0b08] text-[#f6f1e8] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#c9a96e]/20 bg-[#14110d]/90 px-6 py-4 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <Logo color="#f6f1e8" className="h-6 w-auto" />
            </Link>
            <span className="h-4 w-px bg-[#c9a96e]/30" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a96e]">
              YouTube Video Studio
            </span>
          </div>
          <Link
            href="/"
            className="text-xs font-light text-[#f6f1e8]/60 hover:text-[#f6f1e8] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#f6f1e8]">
              Project Explainer Studio
            </h1>
            <p className="mt-2 text-sm text-[#b3aa9e]/80 max-w-2xl">
              Preview, record, and export 1080p Video Explainers &amp; NotebookLM Audio Overviews.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Sidebar: Project Selector */}
          <div className="lg:col-span-4 flex flex-col rounded-2xl border border-[#c9a96e]/20 bg-[#17130e] p-5 shadow-xl">
            <div className="mb-4">
              <label className="block text-[0.68rem] font-mono uppercase tracking-[0.2em] text-[#c9a96e] mb-2">
                Select Project ({filtered.length})
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or developer..."
                className="w-full rounded-lg border border-[#c9a96e]/20 bg-[#0d0b08] px-3.5 py-2.5 text-xs text-[#f6f1e8] placeholder-[#b3aa9e]/40 focus:border-[#c9a96e] focus:outline-none"
              />
            </div>

            <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filtered.map((p) => {
                const selected = p.slug === selectedSlug;
                return (
                  <button
                    key={p.slug}
                    onClick={() => setSelectedSlug(p.slug)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selected
                        ? "border-[#c9a96e] bg-[#c9a96e]/10 shadow-lg"
                        : "border-[#c9a96e]/10 bg-[#100d0a] hover:border-[#c9a96e]/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-2">
                        <p className="font-serif text-sm font-medium text-[#f6f1e8] truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-[#b3aa9e]/60 truncate mt-0.5">{p.dev}</p>
                      </div>
                      <span className="shrink-0 rounded-md border border-[#c9a96e]/30 bg-[#0d0b08] px-2 py-0.5 font-mono text-[10px] text-[#c9a96e]">
                        {p.score}/100
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Panel: Script & Player Studio */}
          <div className="lg:col-span-8 flex flex-col rounded-2xl border border-[#c9a96e]/20 bg-[#17130e] p-6 shadow-xl">
            {loading ? (
              <div className="py-24 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#c9a96e]/20 border-t-[#c9a96e]" />
                <p className="text-xs font-mono tracking-widest text-[#c9a96e] uppercase">
                  Loading Studio Assets...
                </p>
              </div>
            ) : script ? (
              <>
                {/* Project Header Info */}
                <div className="border-b border-[#c9a96e]/15 pb-5 mb-6 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">
                      {script.location} · HRERA Verified
                    </span>
                    <h2 className="font-serif text-2xl font-medium text-[#f6f1e8] mt-1">
                      {script.projectName}
                    </h2>
                    <p className="text-xs text-[#b3aa9e]/70">by {script.developer}</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#c9a96e]">Truth Score</div>
                      <div className="font-serif text-2xl font-semibold text-[#f6f1e8]">
                        {script.truthScore}<span className="text-xs text-[#b3aa9e]/60">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Header */}
                <div className="flex gap-2 border-b border-[#c9a96e]/15 pb-3 mb-6">
                  <button
                    onClick={() => setTab("player")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      tab === "player"
                        ? "bg-[#1e6b45] text-white"
                        : "text-[#b3aa9e]/70 hover:text-[#f6f1e8]"
                    }`}
                  >
                    🎬 Live Video Player &amp; Storyboard
                  </button>
                  <button
                    onClick={() => setTab("notebooklm")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      tab === "notebooklm"
                        ? "bg-[#1e6b45] text-white"
                        : "text-[#b3aa9e]/70 hover:text-[#f6f1e8]"
                    }`}
                  >
                    NotebookLM Source Pack
                  </button>
                  <button
                    onClick={() => setTab("short")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      tab === "short"
                        ? "bg-[#1e6b45] text-white"
                        : "text-[#b3aa9e]/70 hover:text-[#f6f1e8]"
                    }`}
                  >
                    60s Short Script
                  </button>
                </div>

                {/* Tab 0: Live Video Player */}
                {tab === "player" && (
                  <div className="space-y-6">
                    {/* Video Canvas Stage */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#c9a96e]/30 bg-[#070604] p-6 shadow-2xl flex flex-col justify-between">
                      {/* Background Ambient Glow */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 50%, #c9a96e 0%, transparent 70%)",
                        }}
                      />

                      {/* Header Badge Card */}
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Logo color="#f6f1e8" className="h-5 w-auto" />
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#c9a96e] border border-[#c9a96e]/30 px-2 py-0.5 rounded bg-[#14110d]/80">
                            Forensic Video Audit
                          </span>
                        </div>
                        <div className="rounded-xl border border-[#c9a96e]/40 bg-[#17130e]/90 px-3 py-1.5 text-center backdrop-blur-md">
                          <span className="block font-mono text-[8px] uppercase tracking-wider text-[#c9a96e]">
                            Truth Score
                          </span>
                          <span className="font-serif text-lg font-bold text-[#f6f1e8]">
                            {script.truthScore}
                            <span className="text-[10px] font-normal text-[#b3aa9e]/60">
                              /100
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Center Card based on activeSec */}
                      <div className="relative z-10 my-auto text-center px-4 py-2">
                        {activeSec === 0 && (
                          <div className="animate-fadeIn">
                            <span className="font-mono text-xs text-[#c9a96e] uppercase tracking-[0.2em]">
                              {script.location}
                            </span>
                            <h3 className="font-serif text-2xl font-medium text-[#f6f1e8] mt-1">
                              {script.projectName}
                            </h3>
                            <p className="text-xs text-[#b3aa9e]/80 mt-1">by {script.developer}</p>
                          </div>
                        )}
                        {activeSec === 1 && (
                          <div className="animate-fadeIn space-y-2">
                            <span className="font-mono text-xs text-[#c9a96e] uppercase tracking-[0.2em]">
                              Financial &amp; Pricing Benchmark
                            </span>
                            <div className="flex justify-center gap-6 mt-2">
                              <div className="rounded-xl border border-[#c9a96e]/20 bg-[#14110d] px-4 py-2">
                                <span className="block font-mono text-[9px] text-[#b3aa9e]/60">
                                  Starting Price
                                </span>
                                <span className="font-serif text-xl font-medium text-[#f6f1e8]">
                                  {script.price}
                                </span>
                              </div>
                              <div className="rounded-xl border border-[#c9a96e]/20 bg-[#14110d] px-4 py-2">
                                <span className="block font-mono text-[9px] text-[#b3aa9e]/60">
                                  5-Year CAGR
                                </span>
                                <span className="font-serif text-xl font-medium text-[#1e6b45]">
                                  {script.cagr}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {activeSec === 2 && (
                          <div className="animate-fadeIn space-y-2">
                            <span className="font-mono text-xs text-[#e05638] uppercase tracking-[0.2em]">
                              Construction &amp; Legal Flags
                            </span>
                            <p className="font-serif text-lg text-[#f6f1e8]">
                              Promised Handover: {script.deliveryYear}
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#e05638]/40 bg-[#e05638]/10 px-3 py-1 text-xs text-[#e05638]">
                              ⚠️ {script.redFlags} Active Red Flags Identified
                            </div>
                          </div>
                        )}
                        {activeSec === 3 && (
                          <div className="animate-fadeIn space-y-2">
                            <span className="font-mono text-xs text-[#1e6b45] uppercase tracking-[0.2em]">
                              Final Buyer Verdict
                            </span>
                            <h3 className="font-serif text-xl font-medium text-[#f6f1e8]">
                              Truth Score {script.truthScore}/100 — {script.scoreTag}
                            </h3>
                            <p className="text-xs text-[#b3aa9e]/80">
                              Read 150+ Checks &amp; 3D Models at truthestate.in
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Subtitle Narration Bar */}
                      <div className="relative z-10 rounded-xl border border-[#c9a96e]/20 bg-[#14110d]/90 px-4 py-3 backdrop-blur-md text-center">
                        <p className="text-xs font-light text-[#f6f1e8]/90 leading-snug">
                          &ldquo;{script.youtubeShortScript.sections[activeSec]?.narration}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Audio Player Controls */}
                    <div className="rounded-xl border border-[#c9a96e]/20 bg-[#0a0806] p-4 flex items-center justify-between gap-4">
                      <audio
                        ref={audioRef}
                        src={audioSrc}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                      />
                      <button
                        onClick={togglePlay}
                        className="rounded-lg bg-[#1e6b45] hover:bg-[#238c55] px-5 py-2.5 text-xs font-medium text-white transition-all flex items-center gap-2"
                      >
                        {isPlaying ? "⏸ Pause Preview" : "▶ Play NotebookLM Audio"}
                      </button>
                      <span className="text-[11px] text-[#b3aa9e]/60 font-mono">
                        Audio Track: m3m-elie-saab.mp3
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 1: NotebookLM Source */}
                {tab === "notebooklm" && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs text-[#b3aa9e]/80">
                        Paste this into NotebookLM to generate a 2-host AI Podcast Audio Overview.
                      </p>
                      <button
                        onClick={handleCopyNotebook}
                        className="rounded-md bg-[#c9a96e]/20 border border-[#c9a96e]/40 px-3.5 py-1.5 text-xs font-medium text-[#c9a96e] hover:bg-[#c9a96e]/30 transition-all flex items-center gap-1.5"
                      >
                        {copied ? "✓ Copied to Clipboard!" : "Copy NotebookLM Source"}
                      </button>
                    </div>
                    <pre className="w-full max-h-[420px] overflow-y-auto rounded-xl border border-[#c9a96e]/15 bg-[#0a0806] p-4 text-[11px] font-mono text-[#f6f1e8]/90 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {notebookMd}
                    </pre>
                  </div>
                )}

                {/* Tab 2: 60s Short Script */}
                {tab === "short" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#b3aa9e]/80 mb-4">
                      Timed narration &amp; visual storyboard for 60-second YouTube Short / Reel.
                    </p>
                    {script.youtubeShortScript.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#c9a96e]/15 bg-[#0a0806] p-4 text-xs"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-[10px] text-[#c9a96e] font-semibold uppercase">
                            {sec.timestamp} · {sec.title}
                          </span>
                        </div>
                        <p className="text-[#f6f1e8] text-sm leading-relaxed mb-2">
                          &ldquo;{sec.narration}&rdquo;
                        </p>
                        <div className="text-[11px] text-[#b3aa9e]/60 flex items-center gap-2">
                          <span className="text-[#c9a96e]">🎬 Visual Trigger:</span> {sec.visual}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-24 text-center text-xs text-[#b3aa9e]/60">
                Select a project from the left panel to open its Video Studio assets.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
