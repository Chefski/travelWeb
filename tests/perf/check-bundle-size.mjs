import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const LIMIT_KB = 500
const nuxtDir = resolve('.output/public/_nuxt')

async function checkBundleSize() {
  let files
  try {
    files = await readdir(nuxtDir)
  } catch {
    console.error(`Could not read directory: ${nuxtDir}`)
    console.error('Make sure you have run "bun run generate" first.')
    process.exit(1)
  }

  const jsFiles = files.filter((f) => f.endsWith('.js'))

  if (jsFiles.length === 0) {
    console.error('No .js files found in', nuxtDir)
    process.exit(1)
  }

  let totalGzipped = 0
  const chunks = []

  for (const file of jsFiles) {
    const content = await readFile(resolve(nuxtDir, file))
    const gzipped = gzipSync(content)
    const sizeKB = gzipped.length / 1024

    chunks.push({ file, raw: content.length, gzipped: gzipped.length, sizeKB })
    totalGzipped += gzipped.length
  }

  // Sort by gzipped size descending
  chunks.sort((a, b) => b.gzipped - a.gzipped)

  const totalKB = totalGzipped / 1024

  console.log('\n--- Bundle Size Report ---\n')
  console.log(
    'File'.padEnd(60),
    'Raw'.padStart(10),
    'Gzipped'.padStart(10),
  )
  console.log('-'.repeat(80))

  for (const chunk of chunks) {
    console.log(
      chunk.file.padEnd(60),
      `${(chunk.raw / 1024).toFixed(1)} KB`.padStart(10),
      `${chunk.sizeKB.toFixed(1)} KB`.padStart(10),
    )
  }

  console.log('-'.repeat(80))
  console.log(
    `Total gzipped JS: ${totalKB.toFixed(1)} KB / ${LIMIT_KB} KB limit`,
  )
  console.log(`JS files: ${jsFiles.length}\n`)

  if (totalKB > LIMIT_KB) {
    console.error(
      `FAIL: Total gzipped JS (${totalKB.toFixed(1)} KB) exceeds ${LIMIT_KB} KB limit.`,
    )
    process.exit(1)
  }

  console.log('PASS: Bundle size is within the limit.')
}

checkBundleSize()
