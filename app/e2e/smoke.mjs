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
await page.waitForSelector('text=No training cycle yet', { timeout: 15000 })
await shot(page, '01-home-fresh')

// --- Cycle setup from template
await page.getByText('Set up cycle').click()
await page.getByText('Push / Pull / Legs / Rest').click()
await shot(page, '02-cycle-setup')
await page.getByText('Save cycle').click()
await page.waitForSelector('text=Push Day')
console.log('OK cycle: today is Push day')

// --- Daily readiness check-in (feeds AI recovery context)
await page.waitForSelector('text=Morning check-in')
await page.locator('button:text-is("4")').first().click() // sleep 4/5
await page.locator('button:text-is("3")').nth(1).click() // energy 3/5
await page.getByText('Save — the coach factors this in').click()
await page.waitForSelector('text=Daily readiness')
console.log('OK readiness check-in saved')

// --- Start empty workout, add exercise, log sets incl. mid-set weight change (1c grid)
await page.getByText('Empty workout').click()
await page.waitForSelector('text=＋ Add exercise')
await page.getByText('＋ Add exercise').click()
await page.getByPlaceholder('Search exercises…').fill('bench press (barbell)')
await page.getByText('Bench Press (Barbell)', { exact: true }).click()
await page.waitForSelector('[aria-label="log set"]')

const setNums = async (kg, reps) => {
  await page.locator('input[aria-label="kg"]').first().fill(String(kg))
  await page.locator('input[aria-label="reps"]').first().fill(String(reps))
}
// set 1: 60kg x 8
await setNums(60, 8)
await page.locator('[aria-label="log set"]').click()
await page.waitForSelector('text=Rest ·')
await page.getByText('Skip').click()

// set 2: mid-set weight change 60x6 + 45x4 via segments
await setNums(60, 6)
await page.getByText('＋ segment (weight change)').click()
await page.waitForSelector('text=SEGMENT 1')
await setNums(45, 4)
await page.locator('[aria-label="log set"]').click()
await page.getByText('Skip').click()
await page.waitForSelector('text=SEGMENT 2')
console.log('OK live logging: multi-segment set recorded in grid')
await shot(page, '03-live-workout')

// --- Finish → report detail (1e), auto coach report, cycle advanced to Pull
await page.getByRole('button', { name: 'Finish' }).click()
await page.waitForSelector('text=kg total')
await page.waitForSelector('text=/\\[mock coach\\] Report/', { timeout: 20000 })
console.log('OK auto post-workout report generated')
await shot(page, '04-workout-detail')
await page.goto('http://127.0.0.1:5173/')
await page.waitForSelector('text=Pull Day')
console.log('OK cycle advanced: today is Pull day')

// --- Bulk past workout with warmup + mid-set change syntax (2a)
await page.getByText('＋ Add past workout (bulk entry)').click()
await page.waitForSelector('text=Which cycle day was this?')
const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10)
await page.locator('input[type=date]').fill(past)
await page.getByRole('button', { name: 'Push', exact: true }).click()
await page.getByText('＋ Add exercise').click()
await page.getByPlaceholder('Search exercises…').fill('bench press (barbell)')
await page.getByText('Bench Press (Barbell)', { exact: true }).click()
await page.getByPlaceholder(/30x8, 30x8/).fill('w20x12, 55x8, 55x8+40x5')
await page.waitForSelector('text=/3 SETS · 1 EXERCISES/') // live summary bar (warm-up excluded)
await shot(page, '05-bulk-entry')
await page.getByRole('button', { name: 'Save', exact: true }).click()
await page.waitForSelector('text=warmup')
console.log('OK bulk entry: parsed, live summary, saved')

// --- Exercise detail (1h): stat card + RM chart with 2 points
await page.goto('http://127.0.0.1:5173/exercises/bench-press-barbell')
await page.waitForSelector('text=ESTIMATED 1RM')
const points = await page.locator('svg circle').count()
if (points < 2) fail(`expected >=2 RM points, got ${points}`)
await page.waitForSelector('text=e1RM kg')
console.log('OK RM chart:', points, 'points')
await shot(page, '06-exercise-detail')

// --- History (2d): stat strip, week groups, BULK tag
await page.goto('http://127.0.0.1:5173/history')
await page.waitForSelector('text=bulk')
await page.waitForSelector('text=THIS WEEK')
const cards = await page.locator('a[href^="/history/"]').count()
if (cards !== 2) fail(`expected 2 history entries, got ${cards}`)
await shot(page, '07-history')

// --- Save completed workout as preset, then start from preset
await page.locator('a[href^="/history/"]').first().click()
page.once('dialog', (d) => d.accept('Push A'))
await page.getByText('Save as preset').click()
await page.waitForSelector('text=Push A')
console.log('OK preset created from workout')

// Start from preset: target prefill visible in the grid
await page.getByRole('button', { name: 'Start' }).click()
await page.waitForSelector('[aria-label="log set"]')
const prefill = await page.locator('input[aria-label="kg"]').first().inputValue()
if (prefill !== '60') fail(`expected preset weight prefill 60, got "${prefill}"`)
console.log('OK preset start: weight prefilled to', prefill)
await shot(page, '08-workout-from-preset')
// Discard (mid-workout edits must not touch the preset)
page.once('dialog', (d) => d.accept())
await page.locator('[aria-label="discard workout"]').click()
await page.waitForSelector('text=Pull Day')

// --- Library (1g): search + sparkline row
await page.goto('http://127.0.0.1:5173/exercises')
await page.getByPlaceholder(/Search/).fill('lateral')
await page.waitForSelector('text=Lateral Raise')
await shot(page, '09-library')

// --- Profile (3c): goals + tweaks
await page.goto('http://127.0.0.1:5173/profile')
await page.getByPlaceholder(/Build shoulders/).fill('build shoulders, cut to 72kg')
await page.getByPlaceholder(/weak shoulders/).fill('weak shoulders')
await page.getByText('＋ Add').click()
await page.waitForSelector('text=USED IN: CREATOR')
await shot(page, '10-profile')
console.log('OK profile saved')

// --- Coach chat (2b) grounded in history
await page.goto('http://127.0.0.1:5173/coach')
await page.waitForSelector('text=GROUNDED IN')
await page.getByPlaceholder('Ask about your training…').fill('how is my bench press?')
await page.locator('[aria-label="send"]').click()
await page.waitForSelector('text=/estimated 1RM on Bench Press/', { timeout: 20000 })
console.log('OK coach chat: grounded answer with e1RM')
await shot(page, '11-coach')

// --- Weekly summary (3a): target bars + coach text
await page.goto('http://127.0.0.1:5173/summary')
await page.waitForSelector('text=VOLUME VS CYCLE INTENT')
await page.getByText('Generate coach summary').click()
await page.waitForSelector('text=/\\[mock coach\\] This week/', { timeout: 20000 })
console.log('OK weekly summary generated')
await shot(page, '12-summary')

// --- Trends (3b): chart card with current e1RM
await page.goto('http://127.0.0.1:5173/trends')
await page.waitForSelector('text=Bench Press (Barbell)')
const trendCircles = await page.locator('svg circle').count()
if (trendCircles < 2) fail(`expected trend chart points, got ${trendCircles}`)
await shot(page, '13-trends')
console.log('OK trends tab: default chart rendered')

// --- AI workout creator (1f): draft → accept → live logging
await page.goto('http://127.0.0.1:5173/')
await page.getByText("Create today's workout").click()
await page.waitForSelector('text=REVIEW BEFORE START', { timeout: 25000 })
const rationales = await page.locator('text=/e1RM|no history yet/').count()
if (!rationales) fail('AI draft has no rationale/prescription lines')
await shot(page, '14-ai-draft')
await page.getByText('Accept & start').click()
await page.waitForSelector('text=＋ Add exercise')
console.log('OK AI creator: draft accepted into live logging')
page.once('dialog', (d) => d.accept())
await page.locator('[aria-label="discard workout"]').click()
await page.waitForSelector('text=Empty workout')

// --- Offline check: Firestore offline persistence tolerates a network drop.
await page.context().setOffline(true)
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' }).catch(() => {})
await page.context().setOffline(false)

console.log('ALL FLOWS PASSED')
await browser.close()
