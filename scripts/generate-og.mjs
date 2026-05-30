import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../assets/og-image.svg')
const outPath = join(__dirname, '../public/og-image.png')

const svg = readFileSync(svgPath, 'utf8')
const resvg = new Resvg(svg, { font: { loadSystemFonts: true } })
const pngData = resvg.render()
const png = pngData.asPng()
writeFileSync(outPath, png)
console.log(`Generated ${outPath} (${(png.length / 1024).toFixed(0)} KB)`)
