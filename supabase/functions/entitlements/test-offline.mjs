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
  /* Premium is the LIVE all-access value — the ₹9,999 tier razorpay-verify
     writes and the only all-access plan the user_profiles.plan CHECK
     constraint (Free / Pro / Premium) permits. */
  t("Premium is all-access (the live tier)", entitlementsFrom({ plan: "Premium" }, []).all === true);
  t("Pro is a mid-tier, not all-access", entitlementsFrom({ plan: "Pro" }, []).all === false);
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


/* ── The four production grants that name matching alone loses ──
   Copied verbatim from user_profiles. Each one belongs to a real customer
   who paid; before the id/slug resolution order they all landed in
   `unmapped`, which is a paywall on a report they own. */
console.log("\nthe four grants that only id / seo-slug can rescue");
const CAT = {
  byId: {
    "d9c43f91-0caa-4e09-a827-51297c59651e": "signature-global-tonino-lamborghini-residences",
    "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6": "dlf-the-arbour",
    "a41bd6c7-aa6a-4507-b8db-5aa72144ad3f": "whiteland-blissville-phase-2",
  },
  bySeoSlug: {
    "gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63": "dlf-the-arbour",
    "gurugram-real-estate-whiteland-blissville-phase-2-southern-peripheral-road-spr-corridor-sector-76":
      "whiteland-blissville-phase-2",
  },
};
const prod = (o) => entitlementsFrom({ unlocked_reports: [JSON.stringify(o)] }, [], CAT);

// name is truncated at the front AND misspelt ("Lambhorgini"); only the id knows
let e = prod({ projectId: "d9c43f91-0caa-4e09-a827-51297c59651e", projectName: "Tonino Lambhorgini Residences",
               projectSlug: "gurugram-real-estate-tonino-lambhorgini-residences-southern-peripheral-road-spr-corridor-sector-71" });
t("misspelt name resolves by projectId", e.unlocked[0] === "signature-global-tonino-lamborghini-residences", e.unlocked.join());
t("  and is not reported unmapped", e.unmapped.length === 0);

// name and slug were both overwritten with the bare UUID
e = prod({ projectId: "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6", projectName: "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6",
           projectSlug: "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6" });
t("UUID-as-name resolves by projectId", e.unlocked[0] === "dlf-the-arbour", e.unlocked.join());

// projectName overwritten with the SEO slug; the id is absent, the slug is good
e = prod({ projectId: "gurugram-real-estate-whiteland-blissville-phase-2-southern-peripheral-road-spr-corridor-sector-76",
           projectName: "gurugram-real-estate-whiteland-blissville-phase-2-southern-peripheral-road-spr-corridor-sector-76",
           projectSlug: "gurugram-real-estate-whiteland-blissville-phase-2-southern-peripheral-road-spr-corridor-sector-76",
           paymentId: "pay_THERHgiU6rLsnx", amountPaid: 999 });
t("slug-as-name resolves by projectSlug", e.unlocked[0] === "whiteland-blissville-phase-2", e.unlocked.join());
t("  the ₹999 payment is not lost", e.from.grants === 1 && e.unmapped.length === 0);

// a healthy grant must still resolve identically, and prefer the id
e = prod({ projectId: "37f9b22b-ccbb-41e8-9e42-009f1d9c2cb6", projectName: "DLF The Arbour",
           projectSlug: "gurugram-real-estate-dlf-the-arbour-golf-course-road-extension-gcre-sector-63" });
t("a healthy grant is unchanged", e.unlocked[0] === "dlf-the-arbour");

// an id we do not know must fall through to the name, not vanish
e = prod({ projectId: "p3", projectName: "Godrej Zenith", projectSlug: "gurugram-real-estate-godrej-zenith-new-gurgaon-sector-89" });
t("unknown demo id falls back to the name", e.unlocked[0] === "godrej-zenith", e.unlocked.join());

// no catalogue at all → old behaviour, never a crash
e = entitlementsFrom({ unlocked_reports: [JSON.stringify({ projectName: "DLF The Arbour" })] }, []);
t("no catalogue still resolves by name", e.unlocked[0] === "dlf-the-arbour");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
