// The single low-readiness rule, shared by UI, prompt context, and the
// deterministic workout generator. Mirrored at app/functions/src/readinessRule.ts —
// keep both files identical (guarded by mirrored tests).

import type { Readiness, WatchMetrics } from '../types'

/** Intensity multiplier applied on a low-readiness day (~12% trim). */
export const LOW_READINESS_SCALE = 0.88

/**
 * Sleep on the manual 1-5 scale: watch sleep score wins, then watch duration,
 * then the manual tap. Null when nothing is known.
 */
export function sleepScoreTo5(r: Readiness): number | null {
  const w = r.watch
  if (w?.sleepScore !== undefined) {
    const s = w.sleepScore
    return s >= 85 ? 5 : s >= 75 ? 4 : s >= 60 ? 3 : s >= 45 ? 2 : 1
  }
  if (w?.sleepMinutes !== undefined) {
    const m = w.sleepMinutes
    return m >= 480 ? 5 : m >= 420 ? 4 : m >= 360 ? 3 : m >= 300 ? 2 : 1
  }
  return r.sleep ?? null
}

/** Resting HR meaningfully above the 7-day baseline (overtraining/illness signal). */
export function rhrElevated(w?: WatchMetrics): boolean {
  return (
    w?.restingHr !== undefined &&
    w.rhrBaseline7d !== undefined &&
    w.restingHr - w.rhrBaseline7d >= 5
  )
}

/**
 * Low readiness → trim intensity. With manual-only data this is byte-identical
 * to the legacy rule (sleep<=2 || energy<=2 || sleep+energy<=4); watch data
 * substitutes derived sleep and adds the elevated-RHR flag. Unknown inputs
 * never count against the user.
 */
export function isLowReadiness(r: Readiness | null | undefined): boolean {
  if (!r) return false
  if (rhrElevated(r.watch)) return true
  // The watch's own readiness score (HRV/RHR/temp-based) flags a rough night directly.
  if (r.watch?.readinessScore !== undefined && r.watch.readinessScore < 60) return true
  const sleep = sleepScoreTo5(r)
  const energy = r.energy ?? null
  if (sleep !== null && sleep <= 2) return true
  if (energy !== null && energy <= 2) return true
  return sleep !== null && energy !== null && sleep + energy <= 4
}

/** 408 → "6h48m" for UI and prompt text. */
export function formatSleepDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}
