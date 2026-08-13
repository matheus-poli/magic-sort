// Photographs the game into public/social-card.jpg, the picture chat clients
// and search results show for the link.
//
// The card is a screenshot rather than a drawing so it cannot drift from what
// it advertises: it is the real atelier in a real browser, taken with the
// Chromium the e2e test already brings. Re-run with `npm run social-card` after
// the look of the game changes.
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

// The shape every unfurler crops to, and the numbers index.html declares.
const CARD = { width: 1200, height: 630 }
const OUTPUT = join(process.cwd(), 'public/social-card.jpg')

// JPEG, not PNG: WhatsApp refuses a heavy image without saying so, and the
// message then arrives with a title and no picture.
const QUALITY = 85
const BUDGET_BYTES = 300_000

const server = await preview({ preview: { port: 4174 } })
const browser = await chromium.launch()

try {
  const page = await browser.newPage({
    viewport: CARD,
    reducedMotion: 'reduce'
  })

  await page.goto(server.resolvedUrls.local[0])
  // The flasks are the subject of the photograph, so wait for one to exist
  // rather than for a duration.
  await page.getByRole('button', { name: /^Flask 1,/ }).waitFor()

  await page.screenshot({
    path: OUTPUT,
    type: 'jpeg',
    quality: QUALITY,
    animations: 'disabled'
  })
} finally {
  await browser.close()
  await server.close()
}

const bytes = statSync(OUTPUT).size
console.log(`wrote public/social-card.jpg — ${Math.round(bytes / 1000)} kB`)

if (bytes > BUDGET_BYTES) {
  console.error(
    `the card is heavier than ${BUDGET_BYTES / 1000} kB, which risks a preview ` +
      'without a picture: lower QUALITY and run again'
  )
  process.exitCode = 1
}
