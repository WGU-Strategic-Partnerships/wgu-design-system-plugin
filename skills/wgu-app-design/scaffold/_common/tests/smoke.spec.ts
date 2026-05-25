import { test, expect } from '@playwright/test'

test('unauthenticated home redirects to /login', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'commit' })
  expect(response).not.toBeNull()
  expect(page.url()).toContain('/login')
})
