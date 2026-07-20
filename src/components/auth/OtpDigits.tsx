"use client";

import { useRef } from "react";

/* ────────────────────────────────────────────────────────────────────────
   OtpDigits — the shared code-entry used by BOTH the office Sign-in and the
   shortlist unlock, so the two OTP experiences stay identical. `len` boxes,
   digit-only, auto-advance on entry, backspace steps back. Controlled via a
   string[] of length `len`.
   ──────────────────────────────────────────────────────────────────────── */
export default function OtpDigits({
  value,
  onChange,
  len = 4,
  autoFocus = false,
  onComplete,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  len?: number;
  autoFocus?: boolean;
  onComplete?: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < len - 1) refs.current[i + 1]?.focus();
    if (digit && i === len - 1 && next.every((d) => d !== "")) onComplete?.();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, len);
    if (!digits) return;
    e.preventDefault();
    const next = [...value];
    for (let k = 0; k < digits.length && i + k < len; k++) next[i + k] = digits[k];
    onChange(next);
    const last = Math.min(i + digits.length, len - 1);
    refs.current[last]?.focus();
    if (next.every((d) => d !== "")) onComplete?.();
  };

  return (
    <div className="flex gap-3">
      {Array.from({ length: len }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={(e) => onPaste(i, e)}
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-14 rounded-lg border border-[#1a1a1a]/[0.18] bg-white text-center font-serif text-[1.5rem] text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/20"
        />
      ))}
    </div>
  );
}
