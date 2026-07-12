# `project_geometry` — the contract

The single source of truth for one project. **Everything project-specific lives
here; nothing else.** The `add-project` skill produces it from the intake; the
advisor engine consumes it. Human-friendly units — **degrees** for angles,
**metres** for distance — the engine converts (degrees → radians) at load.

The engine is universal (sun path, Vastu Shastra rules, the 6-dimension weights);
this file is the only thing that differs between projects.

## Shape

```jsonc
{
  "slug": "signature-global-titanium-spr",   // file + URL id
  "name": "Signature Global Titanium SPR",    // must match the DB project_name (advisor attaches by name)

  "site": {
    "latitudeDeg": 28.42,        // [Q: city] sun path
    "northOffsetDeg": 25,        // [Q: true north ⚠] rotation from plan-up to true north (CW+)
    "floors": 40,                // [Q: floors] G+40
    "floorHeightM": 3.6,         // [default] floor-to-floor
    "lobbyHeightM": 10.8,        // [default] triple-height podium
    "coreHalfWidthM": 3.5,       // [default] lift/stair core half-width along the slab
    "skyFloor": 30,              // [default] premium sky-terrace floor the view score rewards
    "scaleMPerPx": 0.55,         // [Q: scale] provenance of traced coordinates
    "prevailingBreeze": ["W","NW","N"],   // [default Gurugram] airflow alignment
    "viewAnchors": [             // [Q: view anchors] premium=the selling outlook
      { "id": "lagoon", "x": 0, "z": 0, "premium": true }
    ]
    // "hazeScale": 0.42         // [optional] low-winter-sun usability knob; omit = Gurugram default
  },

  "configs": {
    "4.5 BHK": {
      "beds": 4, "baths": 5,          // [read] beds decides which rooms get vastu-scored
      "carpetSqft": 1972, "superSqft": 3780, "balconySqft": 442,   // [read]
      "plate": {                       // [read+⚠] each room's facing as a 45° step from the deck facade (see below)
        "living": 0, "masterBed": 1, "kitchen": 7, "bed2": 3,
        "bed3": 5, "study": 5, "pooja": 5, "bathroom": 4, "entrance": 6
      }
    },
    "3.5 BHK": {
      "beds": 3, "baths": 4,
      "carpetSqft": 1441, "superSqft": 2780, "balconySqft": 443,
      "plate": { "living": 0, "masterBed": 6, "kitchen": 4, "bed2": 4,
                 "bed3": 5, "study": 5, "pooja": 2, "bathroom": 1, "entrance": 2 }
    },
    "3.5 BHK|corner": {                // [⚠] a nose/corner unit has its OWN plate
      "beds": 3, "baths": 4,
      "carpetSqft": 1441, "superSqft": 2780, "balconySqft": 443,
      "plate": { "living": 0, "masterBed": 1, "kitchen": 5, "bed2": 4,
                 "bed3": 3, "study": 3, "pooja": 1, "bathroom": 1, "entrance": 6 }
    }
  },

  "towers": [
    {
      "id": "T-6",                 // [read] label
      "x": -93.5, "z": -66.0,      // [read] centre, metres (+x east / -z north, plan frame)
      "rotDeg": 83.1,              // [read] slab rotation (render loop tunes this)
      "halfWidthM": 21, "halfDepthM": 7.5,   // [read] slab footprint
      "core": 2,                   // [read+⚠] 2 = straight slab (2 units) · 3 = L-shape with a nose (3 units)
      "config": "4.5 BHK",         // [Q: config↔tower]
      "units": [                   // [read] the lines on each floor
        { "id": "101", "mirror":  1, "nose": false },   // facing omitted → derived from geometry
        { "id": "102", "mirror": -1, "nose": false }
      ]
    },
    {
      "id": "T-7",
      "x": -96.3, "z": 88.0, "rotDeg": 90, "halfWidthM": 24, "halfDepthM": 8.0,
      "core": 3, "config": "3.5 BHK",
      "units": [
        { "id": "102", "mirror": -1, "nose": false, "facing": "E" },       // [⚠] override: massing can't show the wing facing
        { "id": "103", "mirror":  1, "nose": true,  "facing": "N", "plate": "3.5 BHK|corner" },
        { "id": "101", "mirror":  1, "nose": false, "facing": "E" }
      ]
    }
    // …remaining towers…
  ]
}
```

## Field semantics

**`plate` offsets** — each room's direction as a **45° step (0–7)** measured from the
unit's **deck/living facade**. `0` = the facade direction itself; `2` = 90° clockwise;
`7` = 45° anticlockwise. The engine adds the unit's real-world facing to the offset to
get the room's absolute compass direction, then scores it against the Vastu rules. The
`mirror` value flips the plate for the opposite-hand unit. Confirm the high-weight
rooms — **entrance, kitchen, master, pooja** — a wrong offset here is a wrong vastu
verdict.

**`facing` (per unit)** — **optional.** If omitted, the engine derives the facing from
the tower's rotation + the unit's side (the normal path). Provide it **only** as an
override when the simplified box massing can't represent the true deck direction
(Titanium's T-7/T-8 wings both face east, which a straight slab can't show). An
override wins over the geometry for *scoring* — the 3D still renders the box.

**`nose` / corner unit** — an L-shaped tower's protruding unit. It carries its own
`plate` (via the `plate` key on the unit) and usually its own `facing`.

**`viewAnchors`** — the outlooks the view score rewards; `premium: true` marks the
selling view. The engine ray-traces each unit's sightline to these vs. neighbouring-
tower obstruction.

## What is NOT here (by design)

- **Vastu rules** — the directional auspiciousness and per-room ideal/good/ok/bad
  tables are universal shastra, baked into the engine. Only the *building's* room
  layout (the `plate`) is project input.
- **Scoring weights, season model, sun benchmark** — universal engine constants.
- **Marketing data** — price, total units, possession, RERA ID come from the Supabase
  v3 pipeline, not this file.

## Provenance tags used above

`[Q: …]` a Tier-1 intake answer · `[read]` taken from the images · `[⚠]` passed the
Phase-2 confirmation gate · `[default]` a Tier-2 value with a safe default · `[optional]`
omit unless sharpening.
