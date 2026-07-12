# `unit_intelligence` — the DB contract

What `extract.mjs` emits, and the table shape that receives it. One row per
**flat-line** (tower + unit), partitioned by project. Designed for the chatbot:
**numbers to *find* a flat, stored authoritative text to *explain* it.**

## The emitted JSON (per project)

```jsonc
{
  "project": "signature-global-titanium-spr",
  "generated_at": "2026-07-12T…Z",
  "source": "public/tower-intel/signature-global-titanium-spr.html",
  "summary": {
    "tower_ranking": ["T-6","T-7","T-8","T-5","T-3","T-4","T-2"],
    "best_flat": { "tower": "T-6", "unit": "101", "score": 83 },
    "weights": { "morning":25, "cool":20, "vastu":25, "view":15, "vent":10, "floor":5 }
  },
  "flats": [
    {
      "tower": "T-6", "unit": "101", "config": "4.5 BHK",
      "carpet_sqft": 1972, "super_sqft": 3780, "balcony_sqft": 442,
      "score": 83, "grade": "A", "facing": "SE",
      "morning": 100, "cool": 58, "vastu": 72, "view": 97, "airflow": 96, "floor_score": 88,
      "sun_winter_h": 3.538, "sun_am_h": 3.181, "sun_pm_h": 0.357,
      "is_lake": true, "is_corner": true,
      "rank": { "overall": 1, "of": 16, "morning": 1, "cool": 7, "vastu": 1, "view": 4, "airflow": 1, "floor": 15 },
      "weakest_dim": "cool",
      "vastu_overall": "South-east is the Agni (fire) corner …",
      "vastu_rooms": {
        "kitchen":  { "dir":"E",  "score":2, "ideal":"SE", "reason":"Kitchen belongs in the SE (Agni corner)…" },
        "pooja":    { "dir":"N",  "score":3, "ideal":"NE", "reason":"Puja room belongs in the NE (Ishan kona)…" },
        "masterBed":{ "dir":"S",  "score":4, "ideal":"SW", "reason":"Master bedroom in the SW (earth zone)…" },
        "entrance": { "dir":"NE", "score":5, "ideal":"NE", "reason":"The main door is most auspicious in the NE…" }
        // …living, bed2, bed3, bathroom (+ pooja only for 4-bed configs)
      }
    }
    // …one per flat-line…
  ]
}
```

## Why each field earns its place

- **`score` + `rank.overall`/`of`** — the answer *and* its evidence ("#1 of 16").
- **The six dimensions** (`morning, cool, vastu, view, airflow, floor_score`) each with a
  **within-project `rank`** — turns "best airflow" into `ORDER BY airflow` and the reply
  into "top airflow, #1 of 16."
- **`weakest_dim`** — the honest "but…" so the bot never oversells ("best airflow, but
  only average summer-cool").
- **`vastu_rooms` + `vastu_overall`** — the *authoritative* reasons the engine itself
  emits (kitchen in the Agni corner, pooja in the Ishan). The bot **quotes** these; it
  never composes vastu prose itself — that's how "vastu can't be wrong" is protected.
- **`is_lake` / `is_corner` / `facing` / sun hours** — the raw drivers behind the scores.

## Suggested table (Postgres / Supabase)

```sql
create table unit_intelligence (
  project      text not null,
  tower        text not null,
  unit         text not null,
  config       text,
  carpet_sqft  int,  super_sqft int,  balcony_sqft int,
  score        int,  grade text,      facing text,
  morning int, cool int, vastu int, view int, airflow int, floor_score int,
  rank_overall int, rank_of int,
  rank_morning int, rank_cool int, rank_vastu int, rank_view int, rank_airflow int, rank_floor int,
  sun_winter_h numeric, sun_am_h numeric, sun_pm_h numeric,
  is_lake bool, is_corner bool, weakest_dim text,
  vastu_overall text,
  vastu_rooms  jsonb,            -- { kitchen:{dir,score,ideal,reason}, … }
  computed_at  timestamptz,
  primary key (project, tower, unit)
);
-- a thin per-project summary (ranking, best flat, weights) → project_advisor
```

## How the chatbot uses it

- *"Best flat for airflow?"* → `… where project=$1 order by airflow desc limit 1` → read its `vastu_overall`/flags to explain.
- *"Best vastu flat?"* → `order by vastu desc` → quote `vastu_rooms` for the *why*.
- *"Why is this flat best?"* → one-row fetch → the six scores + their ranks + `weakest_dim` + the room reasons *are* the explanation.

Recommended consumption: expose **typed query functions** (`best_flat_by(project,dim)`,
`flat_detail(project,tower,unit)`) rather than free-form SQL — safer and it keeps the
vastu answers to the stored authoritative text.

## Loading it

The extractor writes the JSON; loading into the table is a `project`-scoped upsert
(delete-then-insert the project's rows) via a **service-role** connection — the one
write-path decision still open (the public site is anon-read-only). Until that's wired,
the JSON file *is* the deliverable.
