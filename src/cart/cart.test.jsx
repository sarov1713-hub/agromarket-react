import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App.jsx';
import { API_URL } from '../api.js';

const address = 'Астана, улица Тестовая, 13';
const product = { id: 1, name: 'Яблоки', price: 450, stock: 2, image: '/apples.jpg' };
const order = {
    id: 13, address, status: 'new', total: '900',
    items: [{ product_id: 1, product_name: 'Яблоки', price: 450, quantity: 2 }],
};
const server = setupServer(
    http.get(API_URL + '/products', () => HttpResponse.json([
        product, { id: 2, name: 'Груши', price: 350, stock: 0 },
    ])),
    http.get(API_URL + '/orders/my', () => HttpResponse.json([order])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    server.resetHandlers();
    window.history.replaceState(null, '', '/');
});
afterAll(() => server.close());

function open(path) {
    act(() => {
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
}

async function addTwice(user) {
    const button = await screen.findByRole('button', { name: 'В корзину' });
    await user.click(button);
    await user.click(button);
    return button;
}

async function checkout(user) {
    await addTwice(user);
    open('/cart');
    await user.type(screen.getByLabelText('Адрес доставки'), address);
    await user.click(screen.getByRole('button', { name: 'Оформить заказ' }));
}

test('два добавления, лимит остатка, итог и сохранение после повторного открытия', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const button = await addTwice(user);
    expect(screen.getByText('В корзине: 2')).toBeVisible();
    expect(button).toBeDisabled();
    await user.click(button);
    expect(screen.getByRole('link', { name: 'Корзина (2)' })).toBeVisible();
    unmount();
    open('/cart');
    render(<App />);
    expect(screen.getByText('Количество: 2')).toBeVisible();
    expect(screen.getByText('Итого: 900 тг')).toBeVisible();
    expect(screen.getByRole('button', { name: /Увеличить/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Уменьшить/ }));
    expect(screen.getByText('Итого: 450 тг')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(screen.getByText(/Корзина пуста/)).toBeVisible();
});

test('нулевой остаток отключает добавление', async () => {
    render(<App />);
    const card = (await screen.findByRole('heading', { name: 'Груши' })).closest('article');
    expect(within(card).getByRole('button', { name: 'Нет в наличии' })).toBeDisabled();
});

test('оформление отправляет позиции и адрес, очищает корзину и открывает заказ', async () => {
    const received = vi.fn();
    server.use(http.post(API_URL + '/orders', async ({ request }) => {
        received(await request.json());
        return HttpResponse.json(order, { status: 201 });
    }));
    render(<App />);
    await checkout(userEvent.setup());
    expect(await screen.findByText('Заказ №13 оформлен!')).toBeVisible();
    expect(window.location.pathname + window.location.search).toBe('/orders?created=13');
    expect(received).toHaveBeenCalledExactlyOnceWith({ address, items: [{ productId: 1, quantity: 2 }] });
    expect(screen.getByRole('link', { name: 'Корзина (0)' })).toBeVisible();
    expect(JSON.parse(localStorage.getItem('agromarket.cart'))).toEqual([]);
});

test.each([409, 401])('HTTP %i показывает ошибку и сохраняет корзину', async (status) => {
    server.use(http.post(API_URL + '/orders', () =>
        HttpResponse.json({ error: 'Некоторых товаров нет в нужном количестве' }, { status })
    ));
    render(<App />);
    await checkout(userEvent.setup());
    expect(await screen.findByRole('alert')).toHaveTextContent(status === 409 ? /нет в нужном количестве/ : /войдите в аккаунт/);
    expect(screen.getByRole('link', { name: 'Корзина (2)' })).toBeVisible();
    expect(JSON.parse(localStorage.getItem('agromarket.cart'))[0].quantity).toBe(2);
});

test('можно отменить новый заказ', async () => {
    const cancelled = vi.fn();
    server.use(http.post(API_URL + '/orders/13/cancel', () => {
        cancelled();
        return HttpResponse.json({ id: 13, status: 'cancelled' });
    }));
    open('/orders');
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Отменить заказ' }));
    expect(await screen.findByText('Отменён')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Отменить заказ' })).not.toBeInTheDocument();
    expect(cancelled).toHaveBeenCalledTimes(1);
});

test('страница заказов показывает загрузку и пустой результат', async () => {
    server.use(http.get(API_URL + '/orders/my', () => HttpResponse.json([])));
    open('/orders');
    render(<App />);
    expect(screen.getByText('Загрузка заказов…')).toBeVisible();
    expect(await screen.findByText('Заказов пока нет.')).toBeVisible();
});
