/* Card cover for a PDF document. Egress rule: the PDF itself NEVER loads
   before the reader clicks — the cover is a build-rendered page-1 image
   (materialize-media renders it once per deploy), so painting this card
   costs a ~40 KB PNG instead of a multi-MB file. Without a thumb the card
   keeps its designed "PDF · On file" placeholder. */
export default function PdfThumb({ thumb, alt = "" }: { thumb?: string; alt?: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f0e5]/70">
      {/* Placeholder underneath — the cover image (when present) sits over it. */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9a7a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-8 w-8 opacity-70" aria-hidden>
            <path d="M6 2.5h8L19.5 8v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" /><path d="M14 2.5V8h5.5M9 13h6M9 17h6" />
          </svg>
          <p className="mt-2.5 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]/80">PDF · On file</p>
        </div>
      </div>
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full bg-white object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
      )}
    </div>
  );
}
