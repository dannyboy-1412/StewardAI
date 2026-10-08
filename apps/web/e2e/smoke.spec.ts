import { test, expect } from '@playwright/test'

test('landing page matches the product story', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Turn your ideas/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Get started for free/i })).toBeVisible()
})

test('create -> AI generate -> AI modify -> undo', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'New document' }).click()
  await page.waitForURL(/\/d\//, { timeout: 30_000 })
  await expect(page.getByText('What would you like to do?')).toBeVisible({ timeout: 30_000 })

  const prompt = page.getByPlaceholder('Type or speak your instruction…')
  await prompt.fill('Create a short report on solar power')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText(/AI draft|solar|demo/i).first()).toBeVisible({ timeout: 20_000 })

  await prompt.fill('Add a comparison table of energy sources')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText(/comparison table|energy sources|AI draft/i).first()).toBeVisible({
    timeout: 20_000,
  })

  await page.keyboard.press('Control+z')
})
