import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiURL } from '../scripts/e2e-environment.mjs';

async function loginAdmin(page) {
  await page.goto('/');
  const form = page.getByRole('region', { name: 'Вход' });
  await form.getByLabel('Email', { exact: true }).fill(process.env.E2E_FARMER_EMAIL);
  await form.getByLabel('Пароль').fill(process.env.E2E_FARMER_PASSWORD);
  const response = page.waitForResponse(r => r.url() === apiURL + '/auth/login' && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Войти', exact: true }).click();
  const result = await response;
  expect(result.status()).toBe(200);
  await expect(page.getByRole('region', { name: 'Аккаунт' })).toContainText('(admin)');
  return (await result.json()).token;
}

test('неверный пароль возвращает 401 и не создаёт сессию', async ({ page }) => {
  await page.goto('/');
  const form = page.getByRole('region', { name: 'Вход' });
  await form.getByLabel('Email', { exact: true }).fill(process.env.E2E_FARMER_EMAIL);
  await form.getByLabel('Пароль').fill('intentionally-wrong-local-password');
  const pending = page.waitForResponse(r => r.url() === apiURL + '/auth/login');
  await form.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await pending).status()).toBe(401);
  await expect(page.getByRole('alert')).toContainText('Неверный email или пароль');
  await expect(page.getByRole('region', { name: 'Аккаунт' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('администратор создаёт товар, видит его в каталоге и удаляет через API', async ({ page, request }) => {
  const token = await loginAdmin(page);
  const name = 'Lab12-' + randomUUID();
  const form = page.getByRole('region', { name: 'Добавить товар', exact: true });
  await form.getByLabel('Название', { exact: true }).fill(name);
  await form.getByLabel('Категория', { exact: true }).fill('Фрукты');
  await form.getByLabel('Цена (тг)', { exact: true }).fill('750');
  const pending = page.waitForResponse(r => r.url() === apiURL + '/products' && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Добавить товар', exact: true }).click();
  const response = await pending;
  expect(response.status()).toBe(201);
  const product = await response.json();
  try {
    const card = page.getByTestId('product-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(card).toBeVisible();
    await expect(card.getByText('750 тг', { exact: true })).toBeVisible();
    await expect(card.getByText('Фрукты', { exact: true })).toBeVisible();
  } finally {
    const deleted = await request.delete(apiURL + '/products/' + product.id, { headers: { Authorization: 'Bearer ' + token } });
    expect(deleted.status()).toBe(204);
  }
});

test('цена -500 блокируется браузером, а обход HTML получает реальный HTTP 400', async ({ page, request }) => {
  const token = await loginAdmin(page);
  const form = page.getByRole('region', { name: 'Добавить товар', exact: true });
  await form.getByLabel('Название', { exact: true }).fill('Lab12-negative-price');
  await form.getByLabel('Категория', { exact: true }).fill('Фрукты');
  const price = form.getByLabel('Цена (тг)', { exact: true });
  await price.fill('-500');
  let posts = 0;
  page.on('request', r => { if (r.method() === 'POST' && r.url() === apiURL + '/products') posts++; });
  await form.getByRole('button', { name: 'Добавить товар', exact: true }).click();
  expect(await price.evaluate(input => input.validity.rangeUnderflow)).toBe(true);
  expect(posts).toBe(0);
  const response = await request.post(apiURL + '/products', {
    headers: { Authorization: 'Bearer ' + token },
    data: { name: 'Lab12-negative-price', category: 'Фрукты', price: -500, unit: 'кг' },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'price' })]));
  await expect(form.getByText('Товар добавлен в каталог')).toHaveCount(0);
});
