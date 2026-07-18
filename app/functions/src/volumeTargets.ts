/** Optimal weekly working-set range per muscle (direct sets, primary-muscle counting).
 *  Basis: Schoenfeld dose-response meta-analyses (~10–20 productive zone per group),
 *  2024/25 meta-regressions (diminishing returns past MAV), RP volume landmarks. */
export const MUSCLE_RANGES: Record<string, [lo: number, hi: number]> = {
  chest: [12, 20],
  'front delts': [2, 6],   // heavy indirect volume from pressing
  'side delts': [8, 12],
  'rear delts': [4, 8],
  biceps: [8, 14],
  triceps: [8, 12],
  forearms: [2, 6],
  lats: [8, 12],
  'upper back': [6, 10],
  traps: [2, 6],
  'lower back': [2, 6],
  quads: [8, 14],
  hamstrings: [6, 12],
  glutes: [2, 6],          // mostly covered by squats/hinges
  calves: [4, 8],
  abs: [6, 12],
  obliques: [2, 6],
}

/** Dose-response efficiency of x weekly sets vs optimal range [lo, hi]:
 *  concave rise (diminishing returns) → 100% plateau in range → junk-volume decline. */
export function efficiencyPct(x: number, lo: number, hi: number): number {
  if (x <= 0) return 0
  if (x < lo) return Math.round(100 * (1 - ((lo - x) / lo) ** 2))
  if (x <= hi) return 100
  return Math.round(Math.max(40, 100 - (60 * (x - hi)) / hi))
}

/** Start of the current Monday-based training week, ms. */
export function weekStartMs(now = new Date()): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - day)
  return d.getTime()
}
