import { test, expect } from '@playwright/test';

test('прямая ссылка /cart открывает корзину', async ({ page }) => {
  const response = await page.goto('/cart');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Корзина', exact: true })).toBeVisible();
  await expect(page.getByText(/Корзина пуста/)).toBeVisible();
});
