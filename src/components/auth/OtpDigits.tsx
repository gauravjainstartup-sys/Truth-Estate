"use client";

import { useRef } from "react";

/* ────────────────────────────────────────────────────────────────────────
   OtpDigits — the shared code-entry for every OTP surface on the site, so
   the sign-in, the unlock, the office gate and the consultation all behave
   identically. `len` boxes, digit-only, auto-advance, backspace steps back.

   ── Why tapping the keyboard's code suggestion only filled one box ──
   iOS and Android hand the ENTIRE code to whichever field has focus. Every
   box here carried maxLength={1}, so the browser truncated "4827" to "4"
   before React ever saw it, and setDigit then kept a single character on
   top of that. The suggestion appeared, the tap registered, and three
   digits were dropped on the floor — so auto-submit never fired either,
   because the code was never complete.

   Two things fix it: maxLength is the full length rather than 1, so the
   platform can deliver the whole code; and a multi-character value is
   spread across the boxes instead of being cut down. autoComplete sits on
   the first box only — on all of them, iOS offers to fill each box with
   the whole code in turn.
   ──────────────────────────────────────────────────────────────────────── */
export default function OtpDigits({
  value,
  onChange,
  len = 4,
  autoFocus = false,
  onComplete,
  boxClass,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  len?: number;
  autoFocus?: boolean;
  onComplete?: () => void;
  /* Lets each surface keep its own look while sharing this behaviour —
     the alternative was four copies of the logic, which is how the boxes
     came to disagree with each other in the first place. */
  boxClass?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const commit = (next: string[], focusIdx: number) => {
    onChange(next);
    refs.current[Math.max(0, Math.min(focusIdx, len - 1))]?.focus();
    if (next.length === len && next.every((d) => d !== "")) onComplete?.();
  };

  const onInput = (i: number, raw: string) => {
    let digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = [...value];
      next[i] = "";
      onChange(next);
      return;
    }
    /* Typing over a box that already holds a digit arrives as two
       characters — the old one and the new. That is a replacement, not a
       paste, and treating it as one would push the old digit rightwards. */
    if (digits.length === 2 && digits[0] === (value[i] ?? "")) digits = digits.slice(1);

    if (digits.length > 1) {
      /* A whole code belongs at the start whichever box received it; a
         shorter run is a partial paste and belongs where it landed. */
      const start = digits.length >= len ? 0 : i;
      const next = [...value];
      for (let k = 0; k < digits.length && start + k < len; k++) next[start + k] = digits[k];
      commit(next, start + digits.length);
      return;
    }

    const next = [...value];
    next[i] = digits;
    commit(next, i + 1);
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, len);
    if (!digits) return;
    e.preventDefault();
    const start = digits.length >= len ? 0 : i;
    const next = [...value];
    for (let k = 0; k < digits.length && start + k < len; k++) next[start + k] = digits[k];
    commit(next, start + digits.length);
  };

  const fallback =
    "h-14 w-14 rounded-lg border border-[#1a1a1a]/[0.18] bg-white text-center font-serif text-[1.5rem] text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/20";

  return (
    <div className="flex gap-3">
      {Array.from({ length: len }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={value[i] ?? ""}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={(e) => onPaste(i, e)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          /* Not 1 — see the note at the top. The distribution above keeps
             one digit per box however many arrive. */
          maxLength={len}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className={boxClass ?? fallback}
        />
      ))}
    </div>
  );
}
