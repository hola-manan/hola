// Deterministic mock "coach" used in the emulator: grounded in the real
// context data so e2e tests can assert grounding, no LLM required.

import { e1rmTable, muscleSetCounts, type Workout, type KnowledgeCard } from './domain'
import { CATALOG_BY_ID, type UserData } from './context'
import { musclesForDay } from './creator'

const name = (id: string) => CATALOG_BY_ID.get(id)?.name ?? id

export function mockReport(data: UserData, workout: Workout): string {
  const rms = e1rmTable([workout])
  const strongest = [...rms.entries()].sort((a, b) => b[1] - a[1])[0]
  const prev = data.workouts.find(
    (w) => w.id !== workout.id && w.cycleDay === workout.cycleDay,
  )
  const lines = [
    `[mock coach] Report for your ${workout.cycleDay ?? ''} workout.`,
    strongest
      ? `Best lift today: ${name(strongest[0])} at an estimated 1RM of ${strongest[1].toFixed(1)} kg.`
      : 'No working sets found to estimate strength from.',
    prev
      ? `Compared against your previous ${workout.cycleDay} session on ${new Date(prev.startedAt).toISOString().slice(0, 10)}.`
      : 'No earlier session of this cycle day to compare against yet.',
    data.readiness
      ? `Readiness today: ${[
          data.readiness.watch?.sleepScore !== undefined
            ? `watch sleep score ${data.readiness.watch.sleepScore}/100`
            : data.readiness.sleep !== undefined
              ? `sleep ${data.readiness.sleep}/5`
              : null,
          data.readiness.energy !== undefined ? `energy ${data.readiness.energy}/5` : null,
        ]
          .filter(Boolean)
          .join(', ') || 'logged, no details'}.`
      : null,
    'Suggestion: add one extra working set to your weakest movement next time.',
  ].filter(Boolean)
  return lines.join(' ')
}

export function mockWeeklySummary(data: UserData): string {
  const recent = data.workouts.filter(
    (w) => w.startedAt > Date.now() - 7 * 86_400_000,
  )
  const counts = muscleSetCounts(recent, CATALOG_BY_ID)
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const trained = rows.map(([m, n]) => `${m}: ${n} sets`).join(', ') || 'nothing logged'
  const expected = data.cycle ? new Set(data.cycle.days.flatMap(musclesForDay)) : null
  const missing = expected
    ? [...expected].filter((m) => !counts.has(m)).slice(0, 4)
    : []
  return (
    `[mock coach] This week (${recent.length} workouts): ${trained}.` +
    (missing.length ? ` Under-trained vs your cycle: ${missing.join(', ')}.` : '')
  )
}

export function mockChat(
  data: UserData,
  lastMessage: string,
  cards: KnowledgeCard[] = []
): string {
  const rms = e1rmTable(data.workouts)
  const needle = lastMessage.toLowerCase()
  let reply = ''
  let found = false
  for (const [id, rm] of rms) {
    if (needle.includes(name(id).toLowerCase().split(' (')[0].toLowerCase())) {
      reply = `[mock coach] Your current estimated 1RM on ${name(id)} is ${rm.toFixed(1)} kg, based on ${data.workouts.length} logged workouts.`
      found = true
      break
    }
  }
  if (!found) {
    reply = `[mock coach] You have ${data.workouts.length} workouts logged and ${rms.size} exercises with strength estimates. Ask about a specific lift for details.`
  }
  if (cards.length > 0) {
    reply += `\nSources: ${cards.map((c) => c.sources[0].ref).join('; ')}`
  }
  return reply
}

