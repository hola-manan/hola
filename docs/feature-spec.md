# Gym Tracking & Insights App — Feature Specification (Logical Design)

## Context

Personal gym tracking app for a single user. This session is **feature planning only** — we are locking how each feature behaves logically, not how it's built. The outcome of this doc is a product spec that a later session can turn into a technical design and implementation.

Decisions already locked with the user:
- **Platform:** web page only, **mobile-first** (designed for phone use in the gym; works on desktop too). No native iOS app.
- **Stack anchors:** backend on **GCP**; all LLM features use **Gemini 2.5 Flash via Vertex AI**.
- **Logging:** both modes — live in-gym companion + quick bulk "add past workout" entry.
- **AI insights:** auto post-workout report **plus** free-form chat over history.
- **AI workout creator:** review-&-tweak before starting; **any** workout (AI-generated or preset-based) remains editable mid-workout.
- **Cycle:** actively tracked by the app (app knows what today is, advances on completion).

---

## Core concepts (shared vocabulary)

- **Exercise** — a movement from the library (e.g., Incline DB Press). Has muscle groups, equipment, media, instructions.
- **Set** — one performed set of an exercise. A set is made of **1..n segments**.
- **Segment** — a `(weight × reps)` pair inside a set. A normal set has one segment; a mid-set weight change (e.g., 8 reps @ 30 kg then 4 reps @ 22.5 kg) is one set with two segments. This natively models drop sets too.
- **Workout (session)** — a dated, ordered list of exercises with their sets. Has a status: `planned → in progress → completed`.
- **Preset (template)** — a reusable workout blueprint (exercises + target sets/reps/weights).
- **Cycle** — the user's repeating split (e.g., Push / Pull / Legs / Rest / Upper / Lower / Rest), with a pointer to "today".
- **Profile** — goals, height, bodyweight (tracked over time), and **tweaks**: free-text persistent notes the AI must always respect ("weak shoulders", "left knee acts up on deep squats").

---

## Feature 1 & 2 — Set logging with mid-set weight changes

### Live mode (default)
1. User starts a workout — from today's cycle day, a preset, an AI-generated plan, or empty.
2. For each exercise, the app shows: target sets/reps/weight (if planned), and **last time's numbers** for that exercise alongside.
3. Logging a set: weight + reps pre-filled from the plan (or last session); one tap to confirm, or edit before confirming.
4. **Mid-set weight change:** while logging a set, an "add segment" action appends another `weight × reps` pair to the same set. No limit on segments.
5. Optional per-set fields: set type (warm-up / working / drop / failure), RPE (0–10, optional), note.
6. Rest timer auto-starts after each confirmed set; duration configurable per exercise, skippable.
7. Mid-workout edits always allowed: add/remove/reorder exercises, swap an exercise (library picker suggests same-muscle alternatives), change targets, skip sets. These edits affect **only this session** — unless the user explicitly taps "save back to preset".
8. Finishing: "Complete workout" stamps duration, advances the cycle, and triggers the post-workout AI report.

### Bulk mode ("add past workout")
- Fast grid-style entry: pick exercises, type sets as compact text (`30×8, 30×8, 22.5×6` — segments via a separator like `30×8+22.5×4`), pick date/time. No timers, no live guidance.
- Bulk-entered workouts are first-class history: they feed RM graphs, AI context, and can advance the cycle (user confirms which cycle day it was).

### Counting rules (matter for stats)
- A multi-segment set counts as **one set** toward set counts.
- **Volume (tonnage)** = sum over all segments of `weight × reps`.
- Warm-up sets are logged but excluded from volume/RM stats by default (toggleable).

---

## Feature 3 — LLM insights

### Inputs the AI always gets
1. **History:** all past workouts (recent ones in detail, older ones summarized — e.g., weekly volume per muscle group, RM trends).
2. **Profile:** goals (e.g., "build shoulders, cut to 72 kg"), height, bodyweight trend, tweaks/injury notes.
3. **Cycle state:** current split, where in it today falls, adherence (skipped days).
4. **Wearable data (Amazfit Balance), when available:** last night's sleep (duration + quality), Readiness/BioCharge, calories burned today, resting HR, stress.
   - *Feasibility note (web-only changes this):* Zepp has no official public API, and without a native app there's no HealthKit/Health Connect path. Logical design therefore treats wearable data as a **best-effort enhancement layer** with three candidate ingestion routes, to be validated at build time: (a) unofficial Zepp cloud API (works today for sleep/steps/HR but can break anytime), (b) periodic manual import (Zepp data export files), (c) a 20-second **daily check-in** fallback where the user taps in sleep quality and energy level themselves. Whichever route is live, the data lands in the same "daily readiness" record the AI reads — every AI feature must work fine with that record absent.

### Delivery
- **Post-workout report (auto):** appears when a workout completes. Contents: what improved vs the last comparable workout (same cycle day), estimated-RM changes, muscle groups trending up/flat/down, a recovery note if wearable data suggests it ("short sleep + high strain — consider lighter pull day tomorrow"), and one concrete suggestion for next time.
- **Weekly summary (auto):** volume balance across muscle groups vs the cycle's intent, adherence, flagged imbalances (ties directly into "all my muscles are balanced" goal).
- **Chat (on demand):** free-form Q&A grounded in the same context ("why is my bench stalling?", "am I neglecting rear delts?"). Chat can propose actions (e.g., "add face pulls to your Pull preset") which the user can accept with one tap.

---

## Feature 4 — Presets

- A preset = name + optional cycle-day link (e.g., "Push A" → Push days) + ordered exercises, each with target sets × reps × weight. Weight targets can be absolute (30 kg) or relative ("last used", "last used +2.5 kg").
- Created three ways: from scratch, **from a completed workout** ("save as preset"), or **from an AI-generated workout**.
- Starting a workout from a preset copies it into the session; mid-workout edits don't touch the preset unless explicitly saved back (per locked decision).
- A cycle day can have multiple presets (Push A / Push B); the app rotates or lets the user pick.

---

## Feature 5 — RM calculation & progress graphs

- **Estimated 1RM formula:** Epley — `1RM = weight × (1 + reps/30)`. Standard, simple, accurate in the 1–10 rep range. Sets with >12 reps are excluded from RM estimation (formula unreliable); they still count for volume.
- **Multi-segment sets:** each segment gets its own 1RM estimate; the set's 1RM = its best segment. Warm-ups excluded.
- **Per-exercise, per-session value:** the best set 1RM that day → one point on the graph.
- **Graph:** any exercise → estimated 1RM over time; time ranges (1M / 3M / 6M / 1Y / all); toggle overlays for **volume per session** and **best-set weight**; markers where an actual 1-rep max was performed (real data point, not estimate).
- **Derived targets:** from the current e1RM the app can show "what X reps should feel like" (e.g., 75% × 10) — used by the AI creator when prescribing weights.

---

## Feature 6 — Exercise library

- Ships with a curated catalog: name, primary + secondary muscle groups, equipment, difficulty, **short video/animation + photo**, step-by-step instructions, common mistakes. (Seed from an open dataset with media, e.g., free exercise DBs; exact source is a build-time decision.)
- Searchable & filterable (muscle group, equipment, name). Used as the picker everywhere an exercise is chosen (logging, presets, AI creator swaps).
- **Custom exercises:** user can add their own (name + muscle groups minimum; media optional). Custom exercises get full stats/RM support.
- Each library entry has a detail page: media + instructions + **that user's own history and RM graph for it**.

---

## Feature 7 — AI workout creator (+ cycle tracker)

### Cycle tracker (foundation)
- User defines the cycle once as an ordered list of day types (e.g., Push, Pull, Legs, Rest, Upper, Lower, Rest). The app tracks a pointer: completing a workout advances it.
- **Missed day handling:** app asks — *shift* (do it today, everything slides) or *skip* (mark missed, move on). Rest days auto-advance at midnight.
- Home screen always answers: "today is **Pull day** (day 5 of your cycle)".

### Generation
1. User taps "Create today's workout" (or it's offered automatically on opening the app on a training day).
2. AI composes a complete workout: exercises (from the library), sets, **reps and weights for every set**, order, and target rest.
3. It must account for: today's cycle day; **last workout of the same type** (progressive overload: nudge weight/reps where last session's targets were hit); recent volume per muscle group across the whole cycle (balance — bring up lagging muscles, per weekly-summary flags); profile goals and tweaks ("weak shoulders" → shoulder priority on push days; injuries → avoid/substitute); wearable recovery signals if present (poor recovery → reduce intensity ~10–15% or suggest swapping to the rest day); equipment the user actually uses (learned from history).
4. Weight prescriptions come from each exercise's current e1RM (Feature 5), with a stated intent per exercise (e.g., "4×8 @ ~72% e1RM").
5. **Review & tweak:** the draft is shown with a one-line rationale per exercise ("added lateral raises — shoulder volume 40% below your other push muscles"). User can swap/remove/add exercises, edit any number, regenerate with a text instruction ("no barbell today, gym is packed"). Accepting starts the workout (Feature 1 live mode); it can also be saved as a preset.
6. Mid-workout, everything stays editable, same rules as presets.

---

## Cross-cutting decisions

- **Units:** kg default, lb toggle; weight entered in 0.25 kg increments.
- **Single user, personal** — no social features, no multi-account complexity.
- **Offline-tolerant logging** (gyms have bad reception): live logging must work offline and sync later; AI features can require connectivity. Web-only makes this a **PWA requirement** — installable to the home screen, workout-in-progress state cached locally, synced when back online.
- **Platform & stack:** single mobile-first web app (PWA). Backend on **GCP**; all LLM features (post-workout report, weekly summary, chat, workout creator) call **Gemini 2.5 Flash via Vertex AI**. One model, different prompts/contexts per feature; creator and chat use structured output so their results are directly editable/actionable in the UI.

## Suggested build order (for a future implementation session)

1. Foundation: mobile-first web app shell (PWA) + exercise library + set/segment logging (both modes) + workout history.
2. Presets + cycle tracker.
3. RM engine + graphs.
4. LLM insights via Vertex AI Gemini 2.5 Flash (report, weekly summary, chat).
5. AI workout creator.
6. Amazfit enrichment (unofficial Zepp API / import / daily check-in fallback).

## Verification (of this planning deliverable)

No code is produced this session. The spec is verified by user review: each of the 7 requested features maps to a section above, and the locked decisions (both logging modes, report+chat insights, review-&-tweak creator with mid-workout editability, active cycle tracking) are reflected. Next step after approval: commit this spec to the repo branch `claude/gym-tracking-app-features-ifkao8` as the product spec document.
