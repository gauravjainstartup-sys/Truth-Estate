export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Window icon - 4 panes */}
      <rect x="4" y="8" width="60" height="60" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <line x1="34" y1="8" x2="34" y2="68" stroke="white" strokeWidth="1.5" />
      <line x1="4" y1="38" x2="64" y2="38" stroke="white" strokeWidth="1.5" />
      {/* Gold dot at center */}
      <circle cx="34" cy="38" r="3" fill="#c9a96e" />

      {/* TRUTH text */}
      <text
        x="84"
        y="48"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="42"
        fontWeight="500"
        fill="white"
        letterSpacing="4"
      >
        TRUTH
      </text>

      {/* ESTATE text with gold lines */}
      <line x1="84" y1="62" x2="114" y2="62" stroke="#c9a96e" strokeWidth="1" />
      <text
        x="122"
        y="68"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="16"
        fontWeight="400"
        fill="white"
        letterSpacing="8"
      >
        ESTATE
      </text>
      <line x1="232" y1="62" x2="262" y2="62" stroke="#c9a96e" strokeWidth="1" />
    </svg>
  );
}
