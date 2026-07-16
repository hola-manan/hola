// Slice each screen's markup out of the design export into design-refs/<id>.html
// so every screen opens standalone at 402×874 as the pixel spec.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC =
  process.argv[2] ??
  'C:/Users/manan/Downloads/Mobile-first web app design/gym-app-screens-export.html'
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'design-refs')
mkdirSync(outDir, { recursive: true })

const html = readFileSync(SRC, 'utf8')
const IDS = ['1a', '1c', '1e', '1f', '1g', '1h', '2a', '2b', '2c', '2d', '3a', '3b', '3c']

const anchors = IDS.map((id) => ({ id, at: html.indexOf(`id="${id}"`) })).filter((a) => a.at >= 0)
anchors.sort((a, b) => a.at - b.at)

for (let i = 0; i < anchors.length; i++) {
  const { id, at } = anchors[i]
  // end at the NEXT screen's label (any variant, listed or not), skipping our own
  const ownLabel = html.indexOf('dv-olabel', at)
  const nextLabel = html.indexOf('dv-olabel', ownLabel + 1)
  const end = nextLabel > 0 ? nextLabel : html.indexOf('</x-dc>', at)
  let chunk = html.slice(at, end)
  // unwrap: content lives inside <x-import ...> ... </x-import>
  const open = chunk.indexOf('>', chunk.indexOf('<x-import'))
  const close = chunk.lastIndexOf('</x-import>')
  if (open < 0 || close < 0) {
    console.warn(`skip ${id}: no x-import frame`)
    continue
  }
  const label = /dv-olabel">.*?<\/a>([^<]*)</.exec(chunk)?.[1]?.trim() ?? id
  chunk = chunk.slice(open + 1, close).trim()
  const doc = `<!doctype html>
<!-- ${id} — ${label} (extracted from the design export; the pixel spec) -->
<meta charset="utf-8">
<meta name="viewport" content="width=402">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#0b0d10}body{width:402px;min-height:874px}</style>
${chunk}
`
  writeFileSync(join(outDir, `${id}.html`), doc)
  console.log(`${id}.html — ${label}`)
}
