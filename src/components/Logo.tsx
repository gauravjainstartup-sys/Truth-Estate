export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Window icon - 4 panes */}
      <rect x="4" y="8" width="60" height="60" rx="1" stroke="white" strokeWidth="1.8" fill="none" />
      <line x1="34" y1="8" x2="34" y2="68" stroke="white" strokeWidth="1.8" />
      <line x1="4" y1="38" x2="64" y2="38" stroke="white" strokeWidth="1.8" />
      <circle cx="34" cy="38" r="3" fill="#c9a96e" />

      {/* Text via foreignObject for correct CSS font */}
      <foreignObject x="78" y="0" width="340" height="80">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            paddingTop: "2px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "42px",
              fontWeight: 500,
              letterSpacing: "18px",
              lineHeight: 1,
              color: "white",
            }}
          >
            TRUTH
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "5px",
            }}
          >
            <span
              style={{
                display: "block",
                width: "35px",
                height: "1px",
                background: "#c9a96e",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: "14px",
                fontWeight: 400,
                letterSpacing: "14px",
                lineHeight: 1,
                color: "white",
              }}
            >
              ESTATE
            </span>
            <span
              style={{
                display: "block",
                width: "35px",
                height: "1px",
                background: "#c9a96e",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </foreignObject>
    </svg>
  );
}
