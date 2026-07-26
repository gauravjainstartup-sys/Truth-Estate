/* ════════════════════════════════════════════════════════════════
   NEGOTIATION LEVERS — what this particular project hands the buyer.

   Every lever is derived from THIS project's numbers and is withheld
   when the number is missing. That is not caution for its own sake: 97
   report pages carrying the same negotiation advice would be 97 pages of
   duplicate boilerplate, which is worth less than nothing to search and
   nothing at all to a buyer. A lever that cannot cite a figure from this
   file does not appear.

   ── Where the paywall falls ──
   Free: the leverage and the evidence for it. Someone reading the free
   report learns, truthfully, that they hold a card and why.
   Paid: the ask — the sentence to send, the clause to name, the number
   to counter with. That is the part that takes work to be right about,
   and it is the part worth paying for.

   Pure functions over ProjectIntel. Nothing here renders.
   ════════════════════════════════════════════════════════════════ */
import type { ProjectIntel } from "./projects";
import { SCORE_INPUTS, developerOf } from "./projects";

export type Lever = {
  key: string;
  /* The leverage, named in the buyer's language. Free. */
  title: string;
  /* The figure from this project that makes it true. Free — and the
     reason these pages are worth crawling. */
  evidence: string;
  /* What to actually ask for. Paid. */
  ask: string;
};

/* Live progress percentages arrive as decimals, so subtracting two of
   them prints "13.299999999999997 points ahead" — which reads as though
   nobody looked at the page. One decimal, and no trailing ".0". */
const pct = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};
/* Whole units where a fraction would be false precision: you cannot have
   13.3 of a project's units unsold in any sense the buyer cares about. */
const whole = (n: number): string => Math.round(n).toLocaleString("en-IN");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/* "Mar 2030" → months since year 0, so two committed dates can be
   compared without pulling in a date library for eight characters. */
function monthNo(s: string | undefined | null): number | null {
  if (!s) return null;
  const parts = String(s).trim().split(/\s+/);
  const y = parseInt(parts[parts.length - 1], 10);
  if (!Number.isFinite(y)) return null;
  const m = MONTHS.indexOf((parts[0] ?? "").slice(0, 3).toLowerCase());
  return y * 12 + (m < 0 ? 0 : m);
}

export function negotiationLevers(p: ProjectIntel): Lever[] {
  const out: Lever[] = [];
  const con = p.ops?.construction;
  const dev = developerOf(p);

  /* ── 1. Unsold inventory ──
     The single most reliable lever in a primary sale, and the one buyers
     least often know they hold. Only claimed below 90%: at 95%+ the
     scarcity runs the other way and pretending otherwise would send
     someone into a negotiation with a card they do not have. */
  if (con && typeof con.absorptionPct === "number" && con.absorptionPct < 90) {
    const unsold = 100 - con.absorptionPct;
    out.push({
      key: "inventory",
      title: "Unsold stock is their problem, not yours",
      evidence: `${pct(con.absorptionPct)}% of this project is sold, so roughly ${pct(unsold)}% of the inventory is still on their books${
        p.ops?.units ? ` — on ${whole(p.ops.units)} units that is a real number of empty flats` : ""
      }. Carrying cost on unsold stock is what makes a sales head flexible.`,
      ask: `Ask what is unsold in YOUR tower and on your floor band specifically — not project-wide. Stock that has sat through a full quarter is where the discretion lives, and it is usually a floor or a facing nobody has pushed.`,
    });
  }

  /* ── 2. The delivery gap ──
     Modelled handover against the RERA-committed date. Only when our
     model is actually later; a project running to schedule is not a
     negotiation lever and saying so would be a lie in the buyer's
     favour, which is still a lie. */
  const rera = monthNo(con?.reraDate);
  const pred = monthNo(con?.predictedDate);
  if (con && rera != null && pred != null && pred > rera) {
    const slip = pred - rera;
    out.push({
      key: "delivery",
      title: "The delay is already priced — into your agreement",
      evidence: `RERA commits ${con.reraDate}. Our construction-pace model puts handover at ${con.predictedDate} — about ${slip} month${slip === 1 ? "" : "s"} later, read off ${pct(con.actualPct)}% built against ${pct(con.expectedPct)}% due.`,
      ask: `Delay compensation is a clause in the buyer's agreement, not a favour — most buyers never invoke it. Get the revised handover date in writing before you sign, and read the compensation rate against what you would pay them for a late instalment. The two are rarely symmetrical.`,
    });
  }

  /* ── 3. Build stage vs the payment plan ──
     Ahead of schedule means their money comes in faster than they
     budgeted, which is worth something to them. Behind means you should
     not be paying ahead of a structure that is not there. */
  if (con && typeof con.actualPct === "number" && typeof con.expectedPct === "number") {
    const ahead = con.actualPct - con.expectedPct;
    out.push({
      key: "plan",
      title: ahead >= 0 ? "Pay on their pace, not on their calendar" : "Do not fund a slab that is not poured",
      evidence:
        ahead >= 0
          ? `Construction is ${pct(con.actualPct)}% complete against ${pct(con.expectedPct)}% due — ${pct(ahead)} points ahead. A project running ahead collects milestone money sooner than it budgeted for.`
          : `Construction is ${pct(con.actualPct)}% complete against ${pct(con.expectedPct)}% due — ${pct(Math.abs(ahead))} points behind. Time-linked instalments on a project running behind mean paying for progress that has not happened.`,
      ask: `Which plan you take is worth more than most people's discount. Construction-linked against time-linked changes what you have paid by possession, and on a slipping project it changes it substantially. Ask for the milestone schedule in writing and check what each one actually certifies.`,
    });
  }

  /* ── 4. Where the price sits in its corridor ──
     Only when the ticket clears the tracked band — otherwise there is
     nothing to argue with and the buyer should know that too. */
  if (p.psf && p.budget?.[0] && p.ops?.carpetSqft) {
    const impliedPsf = Math.round((p.budget[0] * 1e7) / p.ops.carpetSqft);
    if (impliedPsf > p.psf.high) {
      out.push({
        key: "price",
        title: "You are above the corridor, and they know it",
        evidence: `Entry here implies roughly ₹${impliedPsf.toLocaleString("en-IN")}/sq ft against a tracked ${p.marketShort} band of ₹${p.psf.low.toLocaleString("en-IN")}–${p.psf.high.toLocaleString("en-IN")}. A premium can be earned; it should still be itemised.`,
        ask: `Make them justify the premium line by line — brand, specification, open area, floor rise — and then ask which of those lines is contractual. A premium that cannot be pointed at in the agreement is a premium you are paying on trust.`,
      });
    }
  }

  /* ── 5. The developer's own record ──
     Their history is the strongest thing a buyer can cite, because it is
     theirs and it is on the public record. */
  if (dev?.performance && typeof dev.performance.onTimePct === "number") {
    const perf = dev.performance;
    out.push({
      key: "record",
      title: "Their track record is a fact you are allowed to use",
      evidence: `${p.developer} has delivered ${perf.delivered} of ${perf.launched} launched projects, ${perf.onTimePct}% on time, averaging about ${perf.avgDelayMonths} months' slippage. That is the record you are being asked to underwrite.`,
      ask: `Raise it as arithmetic, not accusation: their own average slippage against the compensation their agreement offers for it. The gap between those two numbers is the ask, and it is a much harder conversation for them than a discount request.`,
    });
  }

  /* ── 6. Anything the legal read has already flagged ──
     A flag is not an allegation; it is a thing to get answered before
     money moves. */
  const flags = p.liveLegal?.keyFlags?.filter(Boolean) ?? [];
  if (flags.length) {
    out.push({
      key: "legal",
      title: "Get the paperwork answered before the cheque, not after",
      evidence: `Our legal read carries ${flags.length} open flag${flags.length === 1 ? "" : "s"} on this file${
        p.liveLegal?.lastUpdated ? `, last checked ${p.liveLegal.lastUpdated}` : ""
      }. Every one of them is cheaper to resolve before you have paid than after.`,
      ask: `Put each flag in writing and ask for a written answer — not a phone call. A developer who will confirm something on paper is telling you something; one who will only say it aloud is telling you more.`,
    });
  }

  /* ── 7. The weakest thing about this project ──
     Available on every scored file, because the anatomy is always
     computed — which matters: without it, a quarter of the catalogue had
     nothing withheld and so nothing to pay for. It is also the most
     uncomfortable lever to raise, and the most useful: the sales team
     has an answer ready for the strengths and rarely for this. */
  const weak = SCORE_INPUTS.filter((i) => p.anatomy?.[i.key] === "weak");
  const soft = weak.length ? weak : SCORE_INPUTS.filter((i) => p.anatomy?.[i.key] === "moderate");
  if (soft.length) {
    const worst = soft[0];
    out.push({
      key: "weakest",
      title: `Their weakest answer is ${worst.label.toLowerCase()}`,
      evidence: `Of the six inputs behind the Truth Score, ${worst.label.toLowerCase()} rates ${
        weak.length ? "weak" : "moderate"
      } on this project — ${worst.meaning.toLowerCase()}. ${
        soft.length > 1 ? `${soft.length} of the six sit at that level or below.` : "It is the one that moves the score least in their favour."
      }`,
      ask: `Put it to them directly and in writing, and watch which way they answer: a specific rebuttal with a document behind it, or a change of subject. Both are information. This is also the question to repeat on a second call to a different person — inconsistent answers on the weakest input are the clearest signal you will get.`,
    });
  }

  return out;
}

/* How many levers a guest sees in full. Three is enough to prove the
   section is real and specific to this project, and leaves the rest as
   an honest reason to pay rather than a manufactured one. */
export const FREE_LEVERS = 3;
