import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const labels = { new: 'Новый', processing: 'В обработке', done: 'Выполнен', cancelled: 'Отменён' };

export default function OrdersPage({ created }) {
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState(null);
    const [cancelError, setCancelError] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        let active = true;
        apiFetch('/orders/my')
            .then((data) => { if (active) setOrders(data); })
            .catch((failure) => { if (active) setError(failure); });
        return () => { active = false; };
    }, []);

    async function cancel(id) {
        setCancelling(id);
        setCancelError(null);
        try {
            const { status } = await apiFetch(`/orders/${id}/cancel`, { method: 'POST' });
            setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
        } catch (failure) {
            setCancelError(failure);
        } finally {
            setCancelling(null);
        }
    }

    const failure = error || cancelError;
    return (
        <section className="contact">
            <h2>Мои заказы</h2>
            {created && <p role="status">Заказ №{created} оформлен!</p>}
            {failure && (
                <p role="alert">
                    {failure.status === 401
                        ? <>Для просмотра заказов <a href="/login">войдите в аккаунт</a>.</>
                        : failure.message}
                </p>
            )}
            {!orders && !error && <p>Загрузка заказов…</p>}
            {orders?.length === 0 && <p>Заказов пока нет.</p>}
            {orders?.length > 0 && (
                <ul className="order-list">
                    {orders.map((order) => (
                        <li key={order.id}>
                            <h3>Заказ №{order.id}</h3>
                            <span>{labels[order.status]}</span>
                            <span>{order.address}</span>
                            <ul>
                                {order.items.map((item) => (
                                    <li key={item.product_id}>{item.product_name} × {item.quantity} · {item.price} тг за единицу</li>
                                ))}
                            </ul>
                            <strong>Итого: {order.total} тг</strong>
                            {order.status === 'new' && (
                                <button type="button" disabled={cancelling !== null} onClick={() => cancel(order.id)}>
                                    {cancelling === order.id ? 'Отмена…' : 'Отменить заказ'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
