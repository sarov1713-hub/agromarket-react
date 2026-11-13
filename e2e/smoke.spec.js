import { test, expect } from '@playwright/test';

// Даже случайная отправка формы браузером не должна достигнуть production.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.abort('blockedbyclient');
    return route.continue();
  });
});

test('@smoke каталог загружается и страница имеет название магазина', async ({ page }) => {
  await page.goto('/');
  const card = page.getByTestId('product-card').or(page.getByRole('article')).first();
  await expect(card.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 75_000 });
  await expect(card.getByRole('button', { name: 'В корзину' })).toBeVisible();
  await expect(card.getByRole('img')).toBeVisible();
  await expect(page).toHaveTitle(/АгроМаркет/);
  await expect(page.getByText('Не удалось загрузить товары')).toHaveCount(0);
});

test('@smoke прямая ссылка /login возвращает SPA и доступную форму', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response.status()).toBe(200);
  const form = page.getByRole('region', { name: 'Вход' });
  await expect(form).toBeVisible();
  await expect(form.getByLabel('Email', { exact: true })).toBeVisible();
  await expect(form.getByLabel('Пароль')).toHaveAttribute('type', 'password');
  await expect(form.getByRole('button', { name: 'Войти', exact: true })).toBeEnabled();
});
