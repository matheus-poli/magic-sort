import { expect, test } from '@playwright/test'

/**
 * The second and last end-to-end test, here because no lower layer can hold it:
 * the test environment has no working storage at all — Node ships a Web Storage
 * of its own that is switched off unless given a file, and it shadows the one
 * jsdom would provide — so a lent double is the most a unit test can prove.
 * Whether a real browser hands the setting back on the next visit is a question
 * only a real browser answers.
 */
test('an apprentice finds colour-blind mode still on when they come back', async ({
  page
}) => {
  await page.goto('./')

  const toggle = page.getByRole('button', { name: 'Colour-blind mode' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await page.reload()

  await expect(
    page.getByRole('button', { name: 'Colour-blind mode' })
  ).toHaveAttribute('aria-pressed', 'true')
  // The elixirs are marked as well as coloured, which is what was asked for.
  await expect(page.getByRole('button', { name: /^Flask 1/ })).toHaveText(
    '▲▼●★'
  )
})
