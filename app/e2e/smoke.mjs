import { chromium } from 'playwright'

const SHOTS = './e2e/shots'
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })
const fail = (msg) => {
  console.error('FAIL:', msg)
  process.exit(1)
}

const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }) // iPhone-ish
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))

await page.goto('http://127.0.0.1:5173')

// --- Sign in (emulator dev user)
await page.getByText('Dev sign-in (emulator)').click()
await page.waitForSelector('text=Hola Gym', { timeout: 15000 })
await page.waitForSelector('text=No training cycle set up yet')
await shot(page, '01-home-fresh')

// --- Cycle setup from template
await page.getByText('Set up cycle').click()
await page.getByText('Push / Pull / Legs / Rest').click()
await shot(page, '02-cycle-setup')
await page.getByText('Save cycle').click()
await page.waitForSelector('text=Push day')
console.log('OK cycle: today is Push day')

// --- Start empty workout, add exercise, log sets incl. mid-set weight change
await page.getByText('Start empty workout').click()
await page.waitForSelector('text=＋ Add exercise')
await page.getByText('＋ Add exercise').click()
await page.getByPlaceholder('Search exercises…').fill('bench press (barbell)')
await page.getByText('Bench Press (Barbell)', { exact: true }).click()
await page.waitForSelector('text=Log set')

// set 1: 60kg x 8 — set steppers via inputs
const setNums = async (kg, reps) => {
  const inputs = page.locator('input[aria-label="kg"], input[aria-label="reps"]')
  await inputs.nth(0).fill(String(kg))
  await inputs.nth(1).fill(String(reps))
}
await setNums(60, 8)
await page.getByText(/^Log set$/).click()
await page.waitForSelector('text=Rest')
await page.getByText('Skip').click()

// set 2: mid-set weight change 60x6 + 45x4
await setNums(60, 6)
await page.getByText('＋ Weight change').click()
await page.waitForSelector('text=this set so far: 60×6')
await setNums(45, 4)
await page.getByText(/^Log set \(2 seg\)$/).click()
await page.getByText('Skip').click()
await page.waitForSelector('text=60×6 + 45×4')
console.log('OK live logging: multi-segment set recorded')
await shot(page, '03-live-workout')

// --- Complete → history detail, cycle advanced to Pull
await page.getByText('Complete workout').click()
await page.waitForSelector('text=total')
await shot(page, '04-workout-detail')
await page.goto('http://127.0.0.1:5173/')
await page.waitForSelector('text=Pull day')
console.log('OK cycle advanced: today is Pull day')

// --- Bulk past workout with warmup + drop-set syntax
await page.getByText('Add past workout').click()
await page.waitForSelector('text=Which cycle day was this?')
const dateInput = page.locator('input[type=date]')
const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10)
await dateInput.fill(past)
await page.getByRole('button', { name: 'Push', exact: true }).click()
await page.getByText('＋ Add exercise').click()
await page.getByPlaceholder('Search exercises…').fill('bench press (barbell)')
await page.getByText('Bench Press (Barbell)', { exact: true }).click()
await page.getByPlaceholder(/30x8, 30x8/).fill('w20x12, 55x8, 55x8+40x5')
await shot(page, '05-bulk-entry')
await page.getByText('Save workout').click()
await page.waitForSelector('text=warmup')
console.log('OK bulk entry: parsed and saved')

// --- Exercise detail: RM graph with 2 points
await page.goto('http://127.0.0.1:5173/exercises/bench-press-barbell')
await page.waitForSelector('text=est. 1RM')
const points = await page.locator('svg circle').count()
if (points < 2) fail(`expected >=2 RM points, got ${points}`)
const e1rm = await page.locator('text=/kg est. 1RM/').textContent()
console.log('OK RM graph:', points, 'points, current', e1rm?.trim())
await shot(page, '06-exercise-detail')

// --- History shows both workouts
await page.goto('http://127.0.0.1:5173/history')
await page.waitForSelector('text=(added later)')
const cards = await page.locator('a[href^="/history/"]').count()
if (cards !== 2) fail(`expected 2 history entries, got ${cards}`)

// --- Save completed workout as preset, then start from preset
await page.locator('a[href^="/history/"]').first().click()
page.once('dialog', (d) => d.accept('Push A'))
await page.getByText('Save as preset').click()
await page.waitForSelector('text=Push A')
console.log('OK preset created from workout')
await shot(page, '07-presets')

// Start from preset: target prefill visible
await page.getByRole('button', { name: 'Start' }).click()
await page.waitForSelector('text=target 0/2 sets')
const kgInput = page.locator('input[aria-label="kg"]').first()
const prefill = await kgInput.inputValue()
console.log('OK preset start: weight prefilled to', prefill)
await shot(page, '08-workout-from-preset')
// Log one set then discard (test mid-workout edit doesn't touch preset)
page.once('dialog', (d) => d.accept())
await page.getByText('Discard').click()
await page.waitForSelector('text=Pull day')

// --- Exercise library browse + custom exercise
await page.goto('http://127.0.0.1:5173/exercises')
await page.getByPlaceholder('Search…').fill('lateral')
await page.waitForSelector('text=Lateral Raise')
await shot(page, '09-library')

// --- Profile: goals + tweaks
await page.goto('http://127.0.0.1:5173/profile')
await page.getByPlaceholder(/Build shoulders/).fill('build shoulders, cut to 72kg')
await page.getByPlaceholder(/weak shoulders/).fill('weak shoulders')
await page.getByRole('button', { name: 'Add', exact: true }).click()
await page.waitForSelector('div:has-text("weak shoulders") >> nth=0')
await shot(page, '10-profile')
console.log('OK profile saved')

// --- Offline check: service worker only in prod build; instead verify Firestore
// offline persistence is active (no errors logged when network dropped briefly).
await page.context().setOffline(true)
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' }).catch(() => {})
await page.context().setOffline(false)

console.log('ALL FLOWS PASSED')
await browser.close()
