import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm.jsx';
import { apiFetch } from '../api.js';

vi.mock('../api.js', () => ({ apiFetch: vi.fn() }));
beforeEach(() => { vi.mocked(apiFetch).mockReset(); });
async function fill(email = 'buyer@example.test') {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Пароль'), 'Password-123');
}
test('пользователь вводит email и пароль', async () => {
  render(<LoginForm />);
  await fill();
  expect(screen.getByLabelText('Email')).toHaveValue('buyer@example.test');
  expect(screen.getByLabelText('Пароль')).toHaveValue('Password-123');
});
test('вход отправляет данные и вызывает onLogin', async () => {
  const user = { id: 7, name: 'Покупатель', role: 'user' };
  apiFetch.mockResolvedValue({ user, token: 'test-token' });
  const onLogin = vi.fn();
  render(<LoginForm onLogin={onLogin} />);
  await fill();
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
    method: 'POST', body: JSON.stringify({ email: 'buyer@example.test', password: 'Password-123' }),
  });
  expect(onLogin).toHaveBeenCalledExactlyOnceWith(user, 'test-token');
});
test('пустые обязательные поля не отправляются', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(screen.getByLabelText('Email')).toBeInvalid();
  expect(apiFetch).not.toHaveBeenCalled();
});
test('некорректный email не отправляется', async () => {
  render(<LoginForm />);
  await fill('invalid-email');
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(screen.getByLabelText('Email')).toBeInvalid();
  expect(apiFetch).not.toHaveBeenCalled();
});
test('регистрация передаёт имя и новые учётные данные', async () => {
  apiFetch.mockResolvedValue({ user: { name: 'Анна' }, token: 'registered' });
  const onLogin = vi.fn();
  render(<LoginForm onLogin={onLogin} />);
  await userEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  await userEvent.type(screen.getByLabelText('Имя'), 'Анна');
  await fill();
  await userEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(apiFetch).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ method: 'POST' }));
  expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ name: 'Анна', email: 'buyer@example.test', password: 'Password-123' });
  expect(onLogin).toHaveBeenCalled();
});
test('ошибка входа показана пользователю', async () => {
  apiFetch.mockRejectedValue(new Error('Неверный email или пароль'));
  render(<LoginForm />);
  await fill();
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
});
