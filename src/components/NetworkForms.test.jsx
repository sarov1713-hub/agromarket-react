import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import LoginForm from './LoginForm.jsx';
import AddProductForm from './AddProductForm.jsx';
import { server } from '../test/server.js';
import { endpoint } from '../test/handlers.js';
import { fillLogin, renderUser } from '../test/utils.jsx';

test.each([401, 429])('MSW: HTTP %i не авторизует и не сохраняет токен', async status => {
  const message = status === 401 ? 'Неверный email или пароль' : 'Слишком много попыток. Попробуйте через 15 минут';
  server.use(http.post(endpoint('/auth/login'), () => HttpResponse.json({ error: message }, { status })));
  const onLogin = vi.fn();
  const { user } = renderUser(<LoginForm onLogin={onLogin} />);
  await fillLogin(user);
  await user.click(screen.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(onLogin).not.toHaveBeenCalled();
  expect(localStorage.getItem('token')).toBeNull();
});

test('MSW: задержка входа блокирует кнопку и повторную отправку', async () => {
  let calls = 0;
  server.use(http.post(endpoint('/auth/login'), async () => {
    calls++;
    await delay(180);
    return HttpResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }));
  const { user } = renderUser(<LoginForm onLogin={vi.fn()} />);
  await fillLogin(user);
  await user.click(screen.getByRole('button', { name: 'Войти' }));
  const button = screen.getByRole('button', { name: 'Подождите…' });
  expect(button).toBeDisabled();
  await user.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
  expect(calls).toBe(1);
});

test('MSW: регистрация показывает HTTP 400 и details.email', async () => {
  server.use(http.post(endpoint('/auth/register'), () => HttpResponse.json({ error: 'Ошибка валидации', details: [{ field: 'email', message: 'Некорректный e-mail' }] }, { status: 400 })));
  const { user } = renderUser(<LoginForm onLogin={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  await user.type(screen.getByLabelText('Имя'), 'Анна');
  await fillLogin(user);
  await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email: Некорректный e-mail');
});

async function fillProduct(user, price = '500') {
  await user.type(screen.getByLabelText('Название'), 'Яблоки');
  await user.type(screen.getByLabelText('Категория'), 'Фрукты');
  await user.type(screen.getByLabelText('Цена (тг)'), price);
}

test('MSW: HTTP 400 товара показывает details.price без ложного успеха', async () => {
  server.use(http.post(endpoint('/products'), () => HttpResponse.json({ error: 'Ошибка валидации', details: [{ field: 'price', message: 'Цена должна быть больше 0' }] }, { status: 400 })));
  const added = vi.fn();
  const { user } = renderUser(<AddProductForm onAdded={added} />);
  await fillProduct(user);
  await user.click(screen.getByRole('button', { name: 'Добавить товар' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Цена: Цена должна быть больше 0');
  expect(added).not.toHaveBeenCalled();
  expect(screen.queryByText('Товар добавлен в каталог')).not.toBeInTheDocument();
});

test('отрицательная цена блокируется HTML до запроса', async () => {
  const called = vi.fn();
  server.use(http.post(endpoint('/products'), () => { called(); return HttpResponse.json({}); }));
  const { user } = renderUser(<AddProductForm onAdded={vi.fn()} />);
  await fillProduct(user, '-500');
  await user.click(screen.getByRole('button', { name: 'Добавить товар' }));
  expect(screen.getByLabelText('Цена (тг)')).toBeInvalid();
  expect(called).not.toHaveBeenCalled();
});

test('MSW: товар отправляет числовую цену и сообщает об успехе', async () => {
  let payload;
  server.use(http.post(endpoint('/products'), async ({ request }) => {
    payload = await request.json();
    return HttpResponse.json({ ...payload, id: 99 }, { status: 201 });
  }));
  const added = vi.fn();
  const { user } = renderUser(<AddProductForm onAdded={added} />);
  await fillProduct(user);
  await user.click(screen.getByRole('button', { name: 'Добавить товар' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Товар добавлен в каталог');
  expect(payload).toEqual({ name: 'Яблоки', category: 'Фрукты', price: 500, unit: 'кг' });
  expect(added).toHaveBeenCalledExactlyOnceWith({ ...payload, id: 99 });
});
