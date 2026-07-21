---
id: weekly-volume-landmarks
title: "Per-muscle weekly volume landmarks"
domain: programming
tags: [volume, landmarks, mev, mrv, programming]
muscles: [all]
evidence: moderate
sources:
  - ref: "Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci 2017;35(11):1073–1082"
    url: "https://pubmed.ncbi.nlm.nih.gov/27433992/"
  - ref: "Schoenfeld BJ, Ogborn D, Krieger JW. Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med 2016;46(11):1689–1697"
    url: "https://pubmed.ncbi.nlm.nih.gov/27102172/"
---
**Claim:** Each muscle has a rough weekly-set range that is productive: below it you
under-stimulate, inside it you get most of the growth, and above it you accumulate fatigue
faster than benefit. These landmarks differ by muscle.

**Evidence:** The dose-response and frequency meta-analyses (Schoenfeld 2016, 2017) support
per-muscle set ranges distributed across ~2 sessions/week; popularized as MEV/MAV/MRV
("minimum effective", "maximum adaptive", "maximum recoverable" volume) landmarks.

**Takeaway:** Program to each muscle's range rather than a single global number — bigger
muscles and those getting heavy indirect work (e.g. front delts from pressing) need fewer
*direct* sets. This is exactly what the app encodes in `MUSCLE_RANGES`, with per-muscle
`[lo, hi]` pairs; the coach should treat those bounds as the target and reason per muscle.
