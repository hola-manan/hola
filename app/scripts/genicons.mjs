// Generate PWA PNG icons (dumbbell on graphite) without image deps: raw RGBA → zlib → PNG.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, draw) {
  const px = Buffer.alloc(size * size * 4)
  draw((x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = 255
  }, size)
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const BG = [11, 13, 16] // #0b0d10
const LIME = [200, 240, 75] // #c8f04b
const TEAL = [87, 196, 204] // #57c4cc

function drawIcon(set, size) {
  const s = size / 64
  const rect = (x, y, w, h, [r, g, b]) => {
    for (let yy = Math.round(y * s); yy < Math.round((y + h) * s); yy++)
      for (let xx = Math.round(x * s); xx < Math.round((x + w) * s); xx++) set(xx, yy, r, g, b)
  }
  rect(0, 0, 64, 64, BG)
  rect(10, 22, 8, 20, LIME)
  rect(46, 22, 8, 20, LIME)
  rect(16, 17, 7, 30, LIME)
  rect(41, 17, 7, 30, LIME)
  rect(23, 29, 18, 6, TEAL)
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png(size, drawIcon))
  console.log(`icon-${size}.png`)
}
