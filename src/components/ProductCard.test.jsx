import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard.jsx';

const product = { id: 1, name: 'Яблоки', price: 450, image: '/apple.jpg' };
test('карточка показывает название', () => {
  render(<ProductCard product={product} />);
  expect(screen.getByRole('heading', { name: 'Яблоки' })).toBeInTheDocument();
});
test('карточка показывает цену', () => {
  render(<ProductCard product={product} />);
  expect(screen.getByText('450 тг')).toBeInTheDocument();
});
test('товар недели и доступное изображение', () => {
  render(<ProductCard product={product} featured />);
  expect(screen.getByText('Товар недели')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Яблоки' })).toHaveAttribute('src', '/apple.jpg');
});
test('без фотографии отображается заглушка', () => {
  render(<ProductCard product={{ ...product, image: null }} />);
  expect(screen.getByText('Фото пока нет')).toBeInTheDocument();
});
test('кнопка передаёт выбранный товар', async () => {
  const onAdd = vi.fn();
  render(<ProductCard product={product} onAdd={onAdd} />);
  await userEvent.click(screen.getByRole('button', { name: 'В корзину' }));
  expect(onAdd).toHaveBeenCalledExactlyOnceWith(product);
});
