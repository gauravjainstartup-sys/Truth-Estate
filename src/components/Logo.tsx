export default function Logo({
  className = "",
  color = "white",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 420 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Window icon - 4 panes */}
      <rect x="4" y="8" width="60" height="60" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
      <line x1="34" y1="8" x2="34" y2="68" stroke={color} strokeWidth="1.8" />
      <line x1="4" y1="38" x2="64" y2="38" stroke={color} strokeWidth="1.8" />
      <circle cx="34" cy="38" r="3" fill="#c9a96e" />

      {/* Wordmark as native SVG text — true vector, stays sharp at any size / DPI
         (the previous foreignObject HTML was rasterised at 420×80 and upscaled,
         which is what made it look soft). Playfair via the app font variable. */}
      <text
        x="78" y="45"
        fill={color}
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 500 }}
        fontSize="42"
        letterSpacing="18"
      >
        TRUTH
      </text>

      {/* ESTATE row: rule · ESTATE · rule (left-aligned under TRUTH) */}
      <line x1="78" y1="63" x2="113" y2="63" stroke="#c9a96e" strokeWidth="1" />
      <text
        x="121" y="68"
        fill={color}
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 400 }}
        fontSize="14"
        letterSpacing="14"
      >
        ESTATE
      </text>
      <line x1="262" y1="63" x2="297" y2="63" stroke="#c9a96e" strokeWidth="1" />
    </svg>
  );
}
