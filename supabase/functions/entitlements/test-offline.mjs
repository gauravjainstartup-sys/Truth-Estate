/* Offline tests for entitlement resolution.
   Run with:  node --experimental-strip-types test-offline.mjs

   Rows below are copied verbatim from production, so the mapping is
   proven against the shapes that actually exist rather than the ones I
   assumed. */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const { entitlementsFrom, isEntitled, slugify } = await import(join(dir, "core.ts"));

let pass = 0, fail = 0;
const t = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra ? "  — " + extra : ""}`); }
};

/* Real entry from user_profiles.unlocked_reports (110 of 111 look like this). */
const grant = (name, slug) => JSON.stringify({
  projectId: "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6",
  projectName: name,
  projectSlug: slug,
  unlockedAt: "2026-06-01T06:17:26.993Z",
});

console.log("\nslug agreement with the site's own liveSlug");
t("DLF The Arbour", slugify("DLF The Arbour") === "dlf-the-arbour");
t("SOBHA CITY, PHASE-5", slugify("SOBHA CITY, PHASE-5") === "sobha-city-phase-5");
t("Ashiana Mulberry Phase - 2", slugify("Ashiana Mulberry Phase - 2") === "ashiana-mulberry-phase-2");

console.log("\na real profile");
{
  const prof = {
    plan: "Free",
    unlocked_reports: [
      grant("DLF The Arbour", "gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63"),
      grant("Elan the Emperor", "gurugram-real-estate-elan-the-emperor-dwarka-expressway-sector-106"),
    ],
  };
  const e = entitlementsFrom(prof, []);
  t("maps prod grants to this site's slugs",
    JSON.stringify(e.unlocked) === JSON.stringify(["dlf-the-arbour", "elan-the-emperor"]),
    JSON.stringify(e.unlocked));
  t("nothing unmapped", e.unmapped.length === 0, JSON.stringify(e.unmapped));
  t("Free is not all-access", e.all === false);
  t("isEntitled agrees", isEntitled(e, "dlf-the-arbour") === true);
  t("and refuses what was not bought", isEntitled(e, "m3m-capital") === false);
  t("isEntitled takes a raw name too", isEntitled(e, "DLF The Arbour") === true);
}

console.log("\npayment with no matching grant still counts");
{
  /* The case that decides the union: money took, grant never written. */
  const e = entitlementsFrom({ plan: "Free", unlocked_reports: [] }, [
    { status: "completed", project_name: "Godrej Astra", package_name: "Project Intelligence Access: Godrej Astra", amount: 999 },
  ]);
  t("payment alone grants access", e.unlocked.includes("godrej-astra"), JSON.stringify(e.unlocked));
  t("counted as a payment source", e.from.payments === 1 && e.from.grants === 0);
}

console.log("\nincomplete payments must not grant");
{
  const e = entitlementsFrom(null, [
    { status: "created", project_name: "DLF Privana South", amount: 999 },
    { status: "failed", project_name: "M3M Altitude", amount: 999 },
  ]);
  t("nothing granted", e.unlocked.length === 0, JSON.stringify(e.unlocked));
}

console.log("\nthe two sources are unioned, not deduplicated away");
{
  const e = entitlementsFrom(
    { plan: "Free", unlocked_reports: [grant("DLF The Arbour", "x")] },
    [{ status: "completed", project_name: "DLF The Arbour", amount: 999 },
     { status: "completed", project_name: "M3M Altitude", amount: 999 }],
  );
  t("same project not double-counted", e.unlocked.filter((s) => s === "dlf-the-arbour").length === 1);
  t("both projects present", e.unlocked.length === 2, JSON.stringify(e.unlocked));
}

console.log("\nplans");
{
  t("Free is not all", entitlementsFrom({ plan: "Free" }, []).all === false);
  t("null plan is not all", entitlementsFrom({ plan: null }, []).all === false);
  /* The trap this guards: a "not Free" test would hand over everything. */
  t("an unknown plan is not all", entitlementsFrom({ plan: "Free Trial" }, []).all === false);
  t("all-access is", entitlementsFrom({ plan: "All-Access" }, []).all === true);
  t("case and spacing ignored", entitlementsFrom({ plan: "  UNLIMITED " }, []).all === true);
  t("all-access entitles anything", isEntitled(entitlementsFrom({ plan: "all" }, []), "anything-at-all") === true);
}

console.log("\nnothing is dropped silently");
{
  const e = entitlementsFrom({
    plan: "Free",
    unlocked_reports: [
      "gurugram-real-estate-some-project-dwarka-expressway-sector-1",  // a bare prod slug, unreversible
      "{not json",
      grant("DLF The Arbour", "x"),
    ],
  }, []);
  t("the good one still maps", e.unlocked.includes("dlf-the-arbour"));
  t("the unreversible slug is reported", e.unmapped.length >= 1, JSON.stringify(e.unmapped));
  t("count reflects only what mapped", e.from.grants === 1, JSON.stringify(e));
  /* The first version slugified `{not json` into an entitlement named
     "not-json". Malformed input must never become access. */
  t("truncated JSON does not become an entitlement",
    !e.unlocked.some((s) => s.includes("not-json")), JSON.stringify(e.unlocked));
  t("both bad entries reported", e.unmapped.length === 2, JSON.stringify(e.unmapped));
}

console.log("\nplain project names, where they do appear, still work");
{
  const e = entitlementsFrom({ unlocked_reports: ["DLF The Arbour", "SOBHA CITY, PHASE-5"] }, []);
  t("accepted as names", e.unlocked.length === 2, JSON.stringify(e.unlocked));
  const bad = entitlementsFrom({ unlocked_reports: ['{"projectName"', "[]", '"', "   "] }, []);
  t("json fragments never grant", bad.unlocked.length === 0, JSON.stringify(bad.unlocked));
}

console.log("\nempty and malformed input");
{
  t("no profile, no payments", entitlementsFrom(null, []).unlocked.length === 0);
  t("unlocked_reports not an array", entitlementsFrom({ unlocked_reports: "oops" }, []).unlocked.length === 0);
  t("isEntitled on an empty set", isEntitled(entitlementsFrom(null, []), "dlf-the-arbour") === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
