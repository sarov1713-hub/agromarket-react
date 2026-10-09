import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function AddProductForm({ onAdded }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    async function handleSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const product = await apiFetch('/products', {
                method: 'POST', body: JSON.stringify({ ...data, price: Number(data.price) }),
            });
            onAdded(product);
            form.reset();
            setMessage('Товар добавлен в каталог');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    return (
        <section className="contact" aria-labelledby="add-product-title">
            <h2 id="add-product-title">Добавить товар</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
                <label htmlFor="product-name">Название</label>
                <input id="product-name" name="name" required />
                <label htmlFor="product-category">Категория</label>
                <input id="product-category" name="category" />
                <label htmlFor="product-price">Цена (тг)</label>
                <input id="product-price" name="price" type="number" min="0" step="1" required />
                <label htmlFor="product-unit">Единица измерения</label>
                <input id="product-unit" name="unit" defaultValue="кг" required />
                {error && <p className="form-error" role="alert">{error}</p>}
                {message && <p role="status">{message}</p>}
                <button type="submit" disabled={loading}>{loading ? 'Сохранение…' : 'Добавить товар'}</button>
            </form>
        </section>
    );
}
