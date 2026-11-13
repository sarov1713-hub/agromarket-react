import { screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import App from './App.jsx';
import { server } from './test/server.js';
import { buyer, endpoint, product, token } from './test/handlers.js';
import { fillLogin, loginRegion, renderUser } from './test/utils.jsx';

test('каталог показывает загрузку, затем данные и правильный URL', async () => {
  let requested;
  server.use(http.get(endpoint('/products'), async ({ request }) => {
    requested = request.url;
    await delay(100);
    return HttpResponse.json([product]);
  }));
  renderUser(<App />);
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Яблоки' })).toBeInTheDocument();
  expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  expect(requested).toBe(endpoint('/products'));
});

test('каталог сообщает об HTTP 500', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  server.use(http.get(endpoint('/products'), () => HttpResponse.json({ error: 'Ошибка сервера' }, { status: 500 })));
  renderUser(<App />);
  expect(await screen.findByText('Не удалось загрузить товары')).toBeInTheDocument();
  expect(screen.queryByText('Товаров нет')).not.toBeInTheDocument();
});

test('каталог сообщает о пустом массиве', async () => {
  server.use(http.get(endpoint('/products'), () => HttpResponse.json([])));
  renderUser(<App />);
  expect(await screen.findByText('Товаров нет')).toBeInTheDocument();
});

test('каталог сообщает об ошибке сети', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  server.use(http.get(endpoint('/products'), () => HttpResponse.error()));
  renderUser(<App />);
  expect(await screen.findByText('Не удалось загрузить товары')).toBeInTheDocument();
});

test('каталог восстанавливается после повторного запроса', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  server.use(http.get(endpoint('/products'), () => HttpResponse.json({ error: 'Сбой' }, { status: 500 }), { once: true }));
  const { user } = renderUser(<App />);
  await user.click(await screen.findByRole('button', { name: 'Повторить загрузку' }));
  expect(await screen.findByRole('heading', { name: product.name })).toBeInTheDocument();
  expect(screen.queryByText('Не удалось загрузить товары')).not.toBeInTheDocument();
});

test('покупатель добавляет товар и фильтрует каталог', async () => {
  const { user } = renderUser(<App />);
  await user.click(await screen.findByRole('button', { name: 'В корзину' }));
  expect(screen.getByText(/Корзина: 1/)).toBeInTheDocument();
  await user.type(screen.getByRole('searchbox', { name: 'Поиск товара' }), 'груша');
  expect(screen.getByText('Товаров нет')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Яблоки' })).not.toBeInTheDocument();
});

test('заявка отправляет JWT и данные пользователя', async () => {
  localStorage.setItem('token', token);
  let received;
  server.use(http.post(endpoint('/orders'), async ({ request }) => {
    received = { authorization: request.headers.get('authorization'), method: request.method, body: await request.json() };
    return HttpResponse.json({ id: 42 }, { status: 201 });
  }));
  const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
  const { user } = renderUser(<App />);
  await screen.findByText(/Вы вошли как Анна/);
  await user.type(screen.getByLabelText('Имя / организация'), 'Анна');
  await user.type(screen.getByLabelText('Email'), 'anna@example.test');
  await user.type(screen.getByLabelText('Телефон'), '+77001234567');
  await user.type(screen.getByLabelText('Объём заказа (кг)'), '10');
  await user.click(screen.getByRole('button', { name: 'Отправить заявку' }));
  expect(received).toMatchObject({ authorization: 'Bearer ' + token, method: 'POST', body: { name: 'Анна', email: 'anna@example.test', quantity: '10' } });
  expect(alertMock).toHaveBeenCalledWith('Заявка №42 принята!');
});

test('401 сбрасывает аккаунт и предлагает войти заново', async () => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ ...buyer, role: 'admin' }));
  server.use(http.get(endpoint('/auth/me'), () => HttpResponse.json({ error: 'Неверный токен' }, { status: 401 })));
  renderUser(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Войдите заново');
  expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Добавить товар' })).not.toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
});

test('вход сохраняет аккаунт, выход удаляет его', async () => {
  const { user } = renderUser(<App />);
  const form = loginRegion();
  await fillLogin(user, form);
  await user.click(form.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByText(/Вы вошли как Анна/)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBe(token);
  expect(JSON.parse(localStorage.getItem('user'))).toEqual(buyer);
  await user.click(screen.getByRole('button', { name: 'Выйти' }));
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
});

test.each(['user', 'admin'])('форма добавления доступна согласно роли %s', async role => {
  localStorage.setItem('token', token);
  server.use(http.get(endpoint('/auth/me'), () => HttpResponse.json({ ...buyer, role })));
  renderUser(<App />);
  await screen.findByRole('region', { name: 'Аккаунт' });
  const form = screen.queryByRole('heading', { name: 'Добавить товар' });
  if (role === 'admin') expect(form).toBeInTheDocument();
  else expect(form).not.toBeInTheDocument();
});

test('регистрация сохраняет пользователя, но не назначает admin', async () => {
  let payload;
  server.use(http.post(endpoint('/auth/register'), async ({ request }) => {
    payload = await request.json();
    return HttpResponse.json({ user: buyer, token }, { status: 201 });
  }));
  const { user } = renderUser(<App />);
  const form = loginRegion();
  await user.click(form.getByRole('button', { name: 'Создать аккаунт' }));
  const register = within(screen.getByRole('region', { name: 'Регистрация' }));
  await user.type(register.getByLabelText('Имя'), 'Анна');
  await fillLogin(user, register);
  expect(register.queryByLabelText(/Роль/)).not.toBeInTheDocument();
  await user.click(register.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(await screen.findByRole('region', { name: 'Аккаунт' })).toHaveTextContent('Анна (user)');
  expect(payload).toEqual({ name: 'Анна', email: 'anna@example.test', password: 'Password-123' });
  expect(localStorage.getItem('token')).toBe(token);
});
