import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm.jsx';
import AddProductForm from './AddProductForm.jsx';

const response = (data, status) => new Response(JSON.stringify(data), { status });
test('429 отображает сообщение сервера при входе', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ error: 'Слишком много попыток. Попробуйте через 15 минут' }, 429));
  render(<LoginForm onLogin={vi.fn()} />);
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.test');
  await userEvent.type(screen.getByLabelText('Пароль'), 'Password123');
  await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Слишком много попыток. Попробуйте через 15 минут');
});
test('регистрация показывает details.email', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ error: 'Ошибка валидации', details: [{ field: 'email', message: 'Некорректный e-mail' }] }, 400));
  render(<LoginForm onLogin={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  await userEvent.type(screen.getByLabelText('Имя'), 'Анна');
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.test');
  await userEvent.type(screen.getByLabelText('Пароль'), 'Password123');
  await userEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email: Некорректный e-mail');
});
test('форма товара показывает details.price и не вызывает onAdded', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({ error: 'Ошибка валидации', details: [{ field: 'price', message: 'Цена должна быть больше нуля' }] }, 400));
  const added = vi.fn();
  render(<AddProductForm onAdded={added} />);
  await userEvent.type(screen.getByLabelText('Название'), 'Яблоки');
  await userEvent.type(screen.getByLabelText('Категория'), 'Фрукты');
  await userEvent.type(screen.getByLabelText('Цена (тг)'), '500');
  await userEvent.click(screen.getByRole('button', { name: 'Добавить товар' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Цена: Цена должна быть больше нуля');
  expect(added).not.toHaveBeenCalled();
});
