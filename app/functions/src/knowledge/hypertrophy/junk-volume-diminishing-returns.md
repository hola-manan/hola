---
id: junk-volume-diminishing-returns
title: "Diminishing returns and junk volume past the productive range"
domain: hypertrophy
tags: [volume, junk-volume, recovery, overreaching]
muscles: [all]
evidence: moderate
sources:
  - ref: "Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci 2017;35(11):1073–1082"
    url: "https://pubmed.ncbi.nlm.nih.gov/27433992/"
---
**Claim:** Adding volume helps only up to a point. Past a muscle's productive range, extra
sets yield little to no additional growth ("junk volume") while adding fatigue that can
impair recovery and subsequent sessions.

**Evidence:** The volume dose-response curve flattens at higher weekly set counts; the
incremental gain per set shrinks as volume climbs, and the highest volumes carry recovery
costs that can offset benefit (Schoenfeld 2017 and subsequent meta-regressions).

**Takeaway:** More is not always better. The app's `MUSCLE_RANGES` encode an upper bound
per muscle; the weekly-volume view flags a muscle as `OVER` when sets exceed it. When a
muscle is already at or above its range, the coach should not prescribe still more volume —
redistribute sets to lagging muscles, or improve set quality (load, proximity to failure)
instead.
