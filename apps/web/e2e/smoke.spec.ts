import { test, expect, type Page } from '@playwright/test'

async function signIn(page: Page) {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  test.skip(!email || !password, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required')
  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/app/, { timeout: 30_000 })
}

test('landing page matches the product story', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Turn your ideas/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Get started for free/i })).toBeVisible()
})

test('app routes require sign in', async ({ page }) => {
  await page.goto('/app')
  await page.waitForURL(/\/login/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
})

test('create -> AI generate -> AI modify -> undo', async ({ page }) => {
  await signIn(page)
  await page.getByRole('button', { name: 'New document' }).click()
  await page.waitForURL(/\/d\//, { timeout: 30_000 })
  await page.getByRole('button', { name: 'AI', exact: true }).click()
  const prompt = page.getByPlaceholder('Type or speak your instruction…')
  await expect(prompt).toBeVisible({ timeout: 30_000 })
  await prompt.fill('Create a short report on solar power')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByRole('heading', { name: 'Review edits' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Apply selected' }).click()
  await expect(page.getByText(/AI draft|solar|demo/i).first()).toBeVisible({ timeout: 20_000 })

  await prompt.fill('Add a comparison table of energy sources')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByRole('heading', { name: 'Review edits' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Apply selected' }).click()
  await expect(page.getByText(/comparison table|energy sources|AI draft/i).first()).toBeVisible({
    timeout: 20_000,
  })

  await page.keyboard.press('Control+z')
})

test('AI review can accept one change, reject another, then undo', async ({ page }) => {
  await signIn(page)
  await page.getByRole('button', { name: 'New document' }).click()
  await page.waitForURL(/\/d\//, { timeout: 30_000 })
  await page.getByRole('button', { name: 'AI', exact: true }).click()
  const prompt = page.getByPlaceholder('Type or speak your instruction…')
  await expect(prompt).toBeVisible({ timeout: 30_000 })
  await prompt.fill('Create a short report on solar power')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByRole('heading', { name: 'Review edits' })).toBeVisible({ timeout: 20_000 })
  const acceptBoxes = page.getByRole('checkbox', { name: 'Accept' })
  await expect(acceptBoxes.first()).toBeVisible()
  if ((await acceptBoxes.count()) > 1) {
    await acceptBoxes.nth(1).uncheck()
  }
  await page.getByRole('button', { name: 'Apply selected' }).click()
  await expect(page.getByRole('heading', { name: 'Review edits' })).toHaveCount(0)
  await expect(page.getByText(/AI draft|solar/i).first()).toBeVisible()
  await page.keyboard.press('Control+z')
})

test('font, find/replace, page break, and export controls exist', async ({ page }) => {
  await signIn(page)
  await page.getByRole('button', { name: 'New document' }).click()
  await page.waitForURL(/\/d\//, { timeout: 30_000 })
  await expect(page.getByLabel('Font')).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Font').selectOption('Georgia')
  await page.getByLabel('Font size').selectOption('14')
  await page.getByRole('button', { name: 'Insert', exact: true }).click()
  await page.getByRole('button', { name: 'Page break' }).click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Find and replace' }).click()
  await expect(page.getByPlaceholder('Find')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'File' }).click()
  await expect(page.getByRole('button', { name: 'Download .docx' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI activity' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Tools' }).click()
  await expect(page.getByRole('button', { name: 'Check references' })).toBeVisible()
})
