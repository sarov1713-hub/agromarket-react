import { useContext, useRef, useState } from 'react';
import { apiFetch } from '../api.js';
import { CartContext } from './CartContext.js';

export default function CartPage({ onCreated, products }) {
    const { items, total, setQuantity, clear } = useContext(CartContext);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const submitting = useRef(false);

    async function checkout(event) {
        event.preventDefault();
        if (submitting.current) return;
        const address = new FormData(event.currentTarget).get('address').trim();
        if (!address) {
            setError({ message: 'Укажите адрес доставки' });
            return;
        }
        submitting.current = true;
        setPending(true);
        setError(null);
        try {
            const order = await apiFetch('/orders', {
                method: 'POST',
                body: JSON.stringify({ address, items: items.map(({ id, quantity }) => ({ productId: id, quantity })) }),
            });
            clear();
            onCreated(order.id);
        } catch (failure) {
            setError(failure);
        } finally {
            submitting.current = false;
            setPending(false);
        }
    }

    return (
        <section className="contact">
            <h2>Корзина</h2>
            {items.length === 0 ? <p>Корзина пуста. <a href="/#catalog">Перейти в каталог</a></p> : (
                <>
                    <ul className="order-list">
                        {items.map(({ id, name, price, quantity, stock }) => {
                            const available = products === null ? stock : products.find((product) => product.id === id)?.stock ?? 0;
                            return (
                                <li key={id}>
                                    <strong>{name}</strong>
                                    <span>{price} тг за единицу</span>
                                    <div className="cart-actions">
                                        <button type="button" aria-label={`Уменьшить количество: ${name}`}
                                            disabled={pending || quantity <= 1} onClick={() => setQuantity(id, quantity - 1, available)}>−</button>
                                        <span>Количество: {quantity}</span>
                                        <button type="button" aria-label={`Увеличить количество: ${name}`}
                                            disabled={pending || quantity >= available} onClick={() => setQuantity(id, quantity + 1, available)}>+</button>
                                        <button type="button" disabled={pending} onClick={() => setQuantity(id, 0)}>Удалить</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <p><strong>Итого: {total} тг</strong></p>
                    <form className="contact-form" onSubmit={checkout}>
                        <label htmlFor="checkout-address">Адрес доставки</label>
                        <input id="checkout-address" name="address" autoComplete="street-address" maxLength={500} required />
                        {error && (
                            <p role="alert">
                                {error.status === 401
                                    ? <>Чтобы оформить заказ, <a href="/login">войдите в аккаунт</a>.</>
                                    : error.message}
                            </p>
                        )}
                        <button type="submit" disabled={pending}>{pending ? 'Оформление…' : 'Оформить заказ'}</button>
                    </form>
                </>
            )}
        </section>
    );
}
