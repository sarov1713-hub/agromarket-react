import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export function renderUser(ui) {
  return { user: userEvent.setup(), ...render(ui) };
}
export async function fillLogin(user, scope = screen) {
  await user.type(scope.getByLabelText('Email'), 'anna@example.test');
  await user.type(scope.getByLabelText('Пароль'), 'Password-123');
}
export function loginRegion() { return within(screen.getByRole('region', { name: 'Вход' })); }
