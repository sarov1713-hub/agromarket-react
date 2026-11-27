import { useEffect, useState } from 'react';
import { CartContext } from './CartContext.js';

const storageKey = 'agromarket.cart';

function loadCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(storageKey));
        return Array.isArray(cart) ? cart.filter((item) =>
            Number.isInteger(item?.id) && typeof item.name === 'string' &&
            Number.isFinite(item.price) && Number.isInteger(item.stock) &&
            Number.isInteger(item.quantity) && item.quantity > 0
        ) : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(loadCart);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }, [items]);

    function add({ id, name, price, stock }) {
        if (!Number.isInteger(stock) || stock < 1) return;
        setItems((current) => {
            const existing = current.find((item) => item.id === id);
            if (!existing) return [...current, { id, name, price, stock, quantity: 1 }];
            if (existing.quantity >= stock) return current;
            return current.map((item) => item.id === id
                ? { ...item, name, price, stock, quantity: item.quantity + 1 }
                : item);
        });
    }

    function setQuantity(id, quantity, currentStock) {
        if (!Number.isInteger(quantity)) return;
        setItems((current) => quantity <= 0
            ? current.filter((item) => item.id !== id)
            : current.map((item) => item.id === id
                ? { ...item, stock: currentStock ?? item.stock,
                    quantity: Math.min(quantity, Math.max(item.quantity, currentStock ?? item.stock)) }
                : item));
    }

    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, add, setQuantity, clear: () => setItems([]), count, total }}>
            {children}
        </CartContext.Provider>
    );
}
