import type { NextConfig } from "next";

/* basePath must agree with src/lib/site.ts, which every component reads for
   its hrefs — the same deployment fact expressed to two layers (the
   framework's asset/route prefix, and our own link builder). Both read one
   env var so they cannot drift:

     staging     NEXT_PUBLIC_BASE_PATH unset  → "/Truth-Estate"  (GitHub Pages)
     production  NEXT_PUBLIC_BASE_PATH=""     → root             (truthestate.in)

   Note `??` and not `||`: an EMPTY STRING is the production value and has
   to survive. `||` would treat it as unset, fall back to "/Truth-Estate",
   and ship a production build addressed to the preview's subdirectory —
   every asset and every link 404ing, on the live domain. */
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "development" ? "" : "/Truth-Estate")).replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
