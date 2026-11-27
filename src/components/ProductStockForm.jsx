import { useState } from 'react';
import { apiFetch } from '../api.js';
import FormError from './FormError.jsx';

export default function ProductStockForm({ product, onSaved }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);

    async function save(event) {
        event.preventDefault();
        const stock = Number(new FormData(event.currentTarget).get('stock'));
        setPending(true);
        setError(null);
        try {
            onSaved(await apiFetch(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ stock }) }));
        } catch (failure) {
            setError(failure);
        } finally {
            setPending(false);
        }
    }

    return (
        <form className="contact-form" onSubmit={save}>
            <label htmlFor={`stock-${product.id}`}>Остаток</label>
            <input key={product.stock} id={`stock-${product.id}`} name="stock" type="number"
                defaultValue={product.stock ?? 0} min={0} max={2147483647} step={1} required disabled={pending} />
            <button disabled={pending}>Сохранить остаток</button>
            <FormError error={error} />
        </form>
    );
}
