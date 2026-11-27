import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('покупатель регистрируется и оформляет заказ из корзины', async ({ page }) => {
  const email = `order-${randomUUID()}@agromarket.test`;
  await page.goto('/login');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  const register = page.getByRole('region', { name: 'Регистрация' });
  await register.getByLabel('Имя', { exact: true }).fill('Покупатель ЛР13');
  await register.getByLabel('Email', { exact: true }).fill(email);
  await register.getByLabel('Пароль').fill('E2e-Test-Password-123');
  await register.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Аккаунт' })).toContainText('Покупатель ЛР13');
  await page.getByRole('link', { name: 'Каталог', exact: true }).click();
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Товар для E2E ЛР13' }) });
  await card.getByRole('button', { name: 'В корзину' }).click();
  await page.getByRole('link', { name: 'Корзина (1)' }).click();
  await page.reload();
  await expect(page.getByText('Количество: 1')).toBeVisible();
  await page.getByLabel('Адрес доставки').fill('Астана, улица Тестовая, 13');
  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/orders\?created=\d+/);
  await expect(page.getByRole('status')).toHaveText(/Заказ №\d+ оформлен!/);
  await expect(page.getByText('Товар для E2E ЛР13 × 1 · 150 тг за единицу')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Корзина (0)' })).toBeVisible();
});
