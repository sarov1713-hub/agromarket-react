import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

const product = { id: 1, name: 'Яблоки', price: 450, category: 'Фрукты' };
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
test('каталог показывает загрузку, затем данные и правильный URL', async () => {
  let resolve;
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((r) => { resolve = r; }));
  render(<App />);
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  await act(async () => { resolve(reply([product])); });
  expect(await screen.findByRole('heading', { name: 'Яблоки' })).toBeInTheDocument();
  expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/products'), expect.any(Object));
});
test('каталог сообщает об HTTP 500', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply({ error: 'Ошибка сервера' }, 500));
  render(<App />);
  expect(await screen.findByText('Не удалось загрузить товары')).toBeInTheDocument();
  expect(screen.queryByText('Товаров нет')).not.toBeInTheDocument();
});
test('каталог сообщает о пустом массиве', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply([]));
  render(<App />);
  expect(await screen.findByText('Товаров нет')).toBeInTheDocument();
});
test('каталог сообщает об ошибке сети', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  render(<App />);
  expect(await screen.findByText('Не удалось загрузить товары')).toBeInTheDocument();
});
test('покупатель добавляет товар и фильтрует каталог', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply([product]));
  render(<App />);
  await userEvent.click(await screen.findByRole('button', { name: 'В корзину' }));
  expect(screen.getByText(/Корзина: 1/)).toBeInTheDocument();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Поиск товара' }), 'груша');
  expect(screen.getByText('Товаров нет')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Яблоки' })).not.toBeInTheDocument();
});
test('заявка отправляет JWT и данные пользователя', async () => {
  localStorage.setItem('token', 'test-token');
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (url.endsWith('/auth/me')) return reply({ id: 5, name: 'Анна', role: 'user' });
    if (url.endsWith('/orders')) return reply({ id: 42 }, 201);
    return reply([product]);
  });
  const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
  render(<App />);
  await screen.findByText(/Вы вошли как Анна/);
  await userEvent.type(screen.getByLabelText('Имя / организация'), 'Анна');
  await userEvent.type(screen.getByLabelText('Email'), 'anna@example.test');
  await userEvent.type(screen.getByLabelText('Телефон'), '+77001234567');
  await userEvent.type(screen.getByLabelText('Объём заказа (кг)'), '10');
  await userEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
  const [, options] = fetchMock.mock.calls.find(([url]) => url.endsWith('/orders'));
  expect(new Headers(options.headers).get('Authorization')).toBe('Bearer test-token');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toMatchObject({ name: 'Анна', email: 'anna@example.test', quantity: '10' });
  expect(alertMock).toHaveBeenCalledWith('Заявка №42 принята!');
});
test('401 сбрасывает аккаунт и предлагает войти заново', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Админ', role: 'admin' }));
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
    url.endsWith('/auth/me') ? reply({ error: 'Неверный токен' }, 401) : reply([product]));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Войдите заново');
  expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Добавить товар' })).not.toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
});
test('вход сохраняет аккаунт, выход удаляет его', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => url.endsWith('/auth/login')
    ? reply({ user: { id: 5, name: 'Анна', role: 'user' }, token: 'new-token' }) : reply([]));
  render(<App />);
  const form = within(screen.getByRole('region', { name: 'Вход' }));
  await userEvent.type(form.getByLabelText('Email'), 'anna@example.test');
  await userEvent.type(form.getByLabelText('Пароль'), 'Password-123');
  await userEvent.click(form.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByText(/Вы вошли как Анна/)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBe('new-token');
  await userEvent.click(screen.getByRole('button', { name: 'Выйти' }));
  expect(localStorage.getItem('token')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
});
