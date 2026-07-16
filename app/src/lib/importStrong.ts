import { repo } from './repo'
import type { Workout, WorkoutExercise, WorkoutSet, Exercise } from '../types'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function parseCSV(text: string) {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(s => s.replace(/"/g, '').trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (!row.trim()) continue
    const safeCols: string[] = []
    let inQuote = false
    let current = ''
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '"') inQuote = !inQuote
      else if (row[c] === ',' && !inQuote) { safeCols.push(current); current = '' }
      else current += row[c]
    }
    safeCols.push(current)
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = safeCols[idx] ? safeCols[idx].replace(/"/g, '').trim() : '' })
    rows.push(obj)
  }
  return rows
}

export async function importStrongCSV(uid: string, catalog: Map<string, Exercise>) {
  const text = await fetch('/strong.csv').then(res => res.text())
  const rows = parseCSV(text)

  const workoutsByDate = new Map<string, any[]>()
  for (const row of rows) {
    if (!row['Date']) continue
    const date = row['Date']
    if (!workoutsByDate.has(date)) workoutsByDate.set(date, [])
    workoutsByDate.get(date)!.push(row)
  }

  const catalogArr = Array.from(catalog.values())
  let importedCount = 0

  for (const [dateStr, wRows] of workoutsByDate.entries()) {
    const workoutName = wRows[0]['Workout Name'] || 'Imported Workout'
    const durationStr = wRows[0]['Duration'] || '0m'
    
    const completedAt = new Date(dateStr.replace(/"/g, '')).getTime()
    if (isNaN(completedAt)) continue
    
    let durationMs = 0
    if (durationStr.includes('h')) {
       const m1 = durationStr.match(/(\d+)h/)
       const m2 = durationStr.match(/(\d+)m/)
       if (m1) durationMs += parseInt(m1[1]) * 60 * 60 * 1000
       if (m2) durationMs += parseInt(m2[1]) * 60 * 1000
    } else {
       const m = durationStr.match(/(\d+)m/)
       if (m) durationMs += parseInt(m[1]) * 60 * 1000
    }
    const startedAt = completedAt - durationMs

    const exList: { exName: string, sets: WorkoutSet[] }[] = []
    
    for (const row of wRows) {
      const exName = row['Exercise Name'] || 'Unknown'
      const weight = parseFloat(row['Weight']) || 0
      const reps = parseFloat(row['Reps']) || 0
      const rpe = parseFloat(row['RPE']) || undefined

      if (exList.length === 0 || exList[exList.length - 1].exName !== exName) {
        exList.push({ exName, sets: [] })
      }

      exList[exList.length - 1].sets.push({
        id: generateId(),
        type: 'working',
        rpe,
        completedAt: completedAt, 
        segments: [{ weightKg: weight, reps }]
      })
    }

    const finalExercises: WorkoutExercise[] = []
    for (const item of exList) {
      const matched = catalogArr.find(c => c.name.toLowerCase() === item.exName.toLowerCase())
      let exId = matched?.id

      if (!exId) {
        exId = 'custom-' + generateId()
        await repo.saveCustomExercise(uid, {
          id: exId,
          name: item.exName,
          primaryMuscles: ['other'] as any,
          secondaryMuscles: [],
          equipment: 'other',
          instructions: [],
          images: [],
          isCustom: true
        })
        catalogArr.push({ id: exId, name: item.exName } as any)
      }

      finalExercises.push({
        exerciseId: exId,
        sets: item.sets
      })
    }

    const w: Workout = {
      id: 'strong-' + generateId(),
      status: 'completed',
      startedAt,
      completedAt,
      name: workoutName,
      exercises: finalExercises,
      bulkEntered: true
    }

    await repo.saveWorkout(uid, w)
    importedCount++
  }
  
  return importedCount
}
