import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('каталог загружается и страница имеет название магазина', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('article').first();
  await expect(card.getByRole('heading', { level: 3 })).toBeVisible({ timeout: 60_000 });
  await expect(card.getByRole('button', { name: 'В корзину' })).toBeVisible();
  await expect(page).toHaveTitle(/АгроМаркет/);
});

test('прямая ссылка /login возвращает SPA', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('region', { name: 'Вход' })).toBeVisible();
});

test('покупатель регистрируется, добавляет товар и отправляет заявку', async ({ page }) => {
  const email = `e2e+${Date.now()}-${randomUUID().slice(0, 8)}@agromarket.test`;
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  const register = page.getByRole('region', { name: 'Регистрация' });
  await register.getByLabel('Имя', { exact: true }).fill('E2E Покупатель');
  await register.getByLabel('Email', { exact: true }).fill(email);
  await register.getByLabel('Пароль').fill('E2e-Test-Password-123');
  await register.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Аккаунт' })).toContainText('E2E Покупатель');
  await page.getByRole('article').first().getByRole('button', { name: 'В корзину' }).click();
  await expect(page.getByText('🛒 Корзина: 1')).toBeVisible();
  await page.getByLabel('Имя / организация').fill('E2E Покупатель');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Телефон').fill('+77000000000');
  await page.getByLabel('Объём заказа (кг)').fill('10');
  await page.getByLabel('Комментарий').fill('Учебная E2E-заявка. Не обрабатывать как реальный заказ.');
  const dialogPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.accept();
  expect(message).toMatch(/^Заявка №\d+ принята!$/);
  await expect(page.getByLabel('Имя / организация')).toHaveValue('');
});

test('гость на /admin видит вход, но не форму администратора', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('region', { name: 'Вход' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Добавить товар' })).toHaveCount(0);
});
