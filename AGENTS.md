<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working agreements (founder-set)

- **Never change any UI component while integrating the UI with the Supabase DB.** Backend/data work wires data into the EXISTING components only — no new templates, no restyling, no layout tweaks. Data the backend doesn't have yet renders as "NA" or through the component's own built-in hide-when-missing behaviour (adapt the data to the UI via `src/lib/liveReport.ts`-style adapters, never the UI to the data). Any UI change requires an explicit, separate ask from the founder.
