// Build src/data/exercises.ts from free-exercise-db (public domain).
import { readFileSync, writeFileSync } from 'node:fs'

const db = JSON.parse(readFileSync(new URL('./exercises-db.json', import.meta.url)))
const byName = new Map(db.map((e) => [e.name, e]))

// Display name override → db name
const PICKS = [
  // Chest
  ['Bench Press (Barbell)', 'Barbell Bench Press - Medium Grip'],
  ['Incline Bench Press (Barbell)', 'Barbell Incline Bench Press - Medium Grip'],
  ['Decline Bench Press (Barbell)', 'Decline Barbell Bench Press'],
  ['Bench Press (Dumbbell)', 'Dumbbell Bench Press'],
  ['Incline Bench Press (Dumbbell)', 'Incline Dumbbell Press'],
  ['Dumbbell Fly', 'Dumbbell Flyes'],
  ['Incline Dumbbell Fly', 'Incline Dumbbell Flyes'],
  ['Pec Deck / Machine Fly', 'Butterfly'],
  ['Cable Crossover', 'Cable Crossover'],
  ['Push-Up', 'Pushups'],
  ['Chest Dip', 'Dips - Chest Version'],
  // Shoulders
  ['Overhead Press (Barbell)', 'Barbell Shoulder Press'],
  ['Overhead Press (Dumbbell)', 'Dumbbell Shoulder Press'],
  ['Arnold Press', 'Arnold Dumbbell Press'],
  ['Lateral Raise', 'Side Lateral Raise'],
  ['Cable Lateral Raise', 'Cable Seated Lateral Raise'],
  ['Front Raise', 'Front Dumbbell Raise'],
  ['Rear Delt Fly (Dumbbell)', 'Reverse Flyes'],
  ['Rear Delt Fly (Cable)', 'Cable Rear Delt Fly'],
  ['Face Pull', 'Face Pull'],
  ['Upright Row', 'Upright Barbell Row'],
  // Back
  ['Deadlift', 'Barbell Deadlift'],
  ['Romanian Deadlift', 'Romanian Deadlift'],
  ['Sumo Deadlift', 'Sumo Deadlift'],
  ['Stiff-Legged Deadlift', 'Stiff-Legged Barbell Deadlift'],
  ['Bent Over Row (Barbell)', 'Bent Over Barbell Row'],
  ['One-Arm Dumbbell Row', 'One-Arm Dumbbell Row'],
  ['Pull-Up', 'Pullups'],
  ['Chin-Up', 'Chin-Up'],
  ['Lat Pulldown (Wide Grip)', 'Wide-Grip Lat Pulldown'],
  ['Lat Pulldown (Close Grip)', 'Close-Grip Front Lat Pulldown'],
  ['Seated Cable Row', 'Seated Cable Rows'],
  ['T-Bar Row', 'T-Bar Row with Handle'],
  ['Straight-Arm Pulldown', 'Straight-Arm Pulldown'],
  ['Back Extension', 'Hyperextensions (Back Extensions)'],
  ['Good Morning', 'Good Morning'],
  ['Shrug (Barbell)', 'Barbell Shrug'],
  ['Shrug (Dumbbell)', 'Dumbbell Shrug'],
  // Biceps
  ['Barbell Curl', 'Barbell Curl'],
  ['Dumbbell Curl', 'Dumbbell Bicep Curl'],
  ['Hammer Curl', 'Hammer Curls'],
  ['Preacher Curl', 'Preacher Curl'],
  ['Incline Dumbbell Curl', 'Incline Dumbbell Curl'],
  ['Concentration Curl', 'Concentration Curls'],
  ['Cable Rope Hammer Curl', 'Cable Hammer Curls - Rope Attachment'],
  ['EZ-Bar Curl', 'Close-Grip EZ Bar Curl'],
  // Triceps
  ['Close-Grip Bench Press', 'Close-Grip Barbell Bench Press'],
  ['Triceps Pushdown', 'Triceps Pushdown'],
  ['Triceps Rope Pushdown', 'Triceps Pushdown - Rope Attachment'],
  ['Skullcrusher', 'Lying Triceps Press'],
  ['Overhead Triceps Extension (Dumbbell)', 'Standing Dumbbell Triceps Extension'],
  ['Overhead Triceps Extension (Cable)', 'Cable Rope Overhead Triceps Extension'],
  ['Triceps Dip', 'Dips - Triceps Version'],
  ['Bench Dip', 'Bench Dips'],
  // Legs
  ['Squat (Barbell)', 'Barbell Squat'],
  ['Front Squat', 'Front Barbell Squat'],
  ['Goblet Squat', 'Goblet Squat'],
  ['Bodyweight Squat', 'Bodyweight Squat'],
  ['Hack Squat (Barbell)', 'Barbell Hack Squat'],
  ['Leg Press', 'Leg Press'],
  ['Leg Extension', 'Leg Extensions'],
  ['Lying Leg Curl', 'Lying Leg Curls'],
  ['Seated Leg Curl', 'Seated Leg Curl'],
  ['Lunge (Dumbbell)', 'Dumbbell Lunges'],
  ['Lunge (Barbell)', 'Barbell Lunge'],
  ['Walking Lunge', 'Barbell Walking Lunge'],
  ['Bulgarian Split Squat (Dumbbell)', 'Split Squat with Dumbbells'],
  ['Bulgarian Split Squat (Barbell)', 'One Leg Barbell Squat'],
  ['Hip Thrust', 'Barbell Hip Thrust'],
  ['Glute Kickback', 'Glute Kickback'],
  ['Standing Calf Raise', 'Standing Calf Raises'],
  ['Seated Calf Raise', 'Seated Calf Raise'],
  ['Calf Press (Leg Press Machine)', 'Calf Press On The Leg Press Machine'],
  // Core
  ['Crunch', 'Crunches'],
  ['Decline Crunch', 'Decline Crunch'],
  ['Cable Crunch', 'Cable Crunch'],
  ['Ab Machine Crunch', 'Ab Crunch Machine'],
  ['Plank', 'Plank'],
  ['Side Plank', 'Side Bridge'],
  ['Hanging Leg Raise', 'Hanging Leg Raise'],
  ['Russian Twist', 'Russian Twist'],
  // Full body / other
  ['Kettlebell Swing', 'One-Arm Kettlebell Swings'],
  ['Farmer’s Walk', "Farmer's Walk"],
  ['Wrist Curl', 'Palms-Up Barbell Wrist Curl Over A Bench'],
  ['Reverse Wrist Curl', 'Palms-Down Wrist Curl Over A Bench'],
]

const missing = PICKS.filter(([, dbName]) => !byName.has(dbName))
if (missing.length) {
  console.error('MISSING:', missing.map((m) => m[1]).join(' | '))
  process.exit(1)
}

const MUSCLE = {
  abdominals: 'abs',
  chest: 'chest',
  triceps: 'triceps',
  biceps: 'biceps',
  forearms: 'forearms',
  lats: 'lats',
  'middle back': 'upper back',
  'lower back': 'lower back',
  traps: 'traps',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  abductors: 'glutes',
  adductors: 'quads',
  neck: 'neck',
}

function mapShoulder(displayName) {
  const n = displayName.toLowerCase()
  if (/rear delt|face pull|reverse/.test(n)) return 'rear delts'
  if (/lateral raise|upright row/.test(n)) return 'side delts'
  return 'front delts'
}

const EQUIP = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  'e-z curl bar': 'ez bar',
  kettlebells: 'kettlebell',
  bands: 'band',
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const mapMuscles = (list, displayName) => {
  const out = []
  for (const m of list) {
    const mapped = m === 'shoulders' ? mapShoulder(displayName) : MUSCLE[m]
    if (mapped && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

// Hand-written instructions where the source db has none.
const INSTRUCTION_OVERRIDES = {
  'Side Plank': [
    'Lie on your side with legs stacked and prop yourself up on your forearm, elbow under shoulder.',
    'Lift your hips until your body forms a straight line from head to feet. Brace your core.',
    'Hold for the target time without letting the hips sag, then switch sides.',
  ],
  'Kettlebell Swing': [
    'Stand with feet shoulder-width apart, kettlebell on the floor slightly in front of you.',
    'Hinge at the hips, grab the handle, and hike the bell back between your legs.',
    'Drive your hips forward explosively to swing the bell to chest height, arms relaxed.',
    'Let the bell swing back between your legs and repeat, keeping your back flat throughout.',
  ],
}

// Side plank works the obliques specifically.
const MUSCLE_OVERRIDES = { 'Side Plank': ['obliques'] }

const exercises = PICKS.map(([displayName, dbName]) => {
  const e = byName.get(dbName)
  return {
    id: slug(displayName),
    name: displayName,
    primaryMuscles: MUSCLE_OVERRIDES[displayName] ?? mapMuscles(e.primaryMuscles, displayName),
    secondaryMuscles: mapMuscles(e.secondaryMuscles, displayName).filter(
      (m) => !mapMuscles(e.primaryMuscles, displayName).includes(m),
    ),
    equipment: EQUIP[e.equipment] ?? 'other',
    instructions: e.instructions.length
      ? e.instructions
      : (INSTRUCTION_OVERRIDES[displayName] ?? []),
    images: e.images.map(
      (i) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${i}`,
    ),
  }
})

// Hand-written entries with no good source in the db (kept across regenerations).
exercises.push({
  id: 'bulgarian-split-squat-bodyweight',
  name: 'Bulgarian Split Squat (Bodyweight)',
  primaryMuscles: ['quads'],
  secondaryMuscles: ['glutes', 'hamstrings'],
  equipment: 'bodyweight',
  instructions: [
    'Stand about 2 to 3 feet in front of a bench with your back to it, and place the top of one foot on the bench behind you.',
    'Keep your torso upright and your front knee in line with your foot. This will be your starting position.',
    'Descend by flexing the front knee and hip, lowering until the front thigh is about parallel to the floor. The rear knee should travel toward the ground.',
    'Drive through the heel of the front foot to return to the starting position. Complete all reps, then switch legs.',
  ],
  images: [
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/0.jpg',
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/1.jpg',
  ],
})

const header = `// Curated exercise catalog seeded from free-exercise-db (public domain).
// https://github.com/yuhonas/free-exercise-db — regenerate via scripts/curate.mjs
import type { Exercise } from '../types'

export const EXERCISES: Exercise[] = `

writeFileSync(
  '/home/user/hola/app/src/data/exercises.ts',
  header + JSON.stringify(exercises, null, 2) + '\n',
)
console.log(`wrote ${exercises.length} exercises`)
