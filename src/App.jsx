import { useContext, useEffect, useState } from 'react';

import ProductCard from './components/ProductCard';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactForm from './components/ContactForm';

import { apiFetch } from './api.js';
import LoginForm from './components/LoginForm.jsx';
import AddProductForm from './components/AddProductForm.jsx';
import ProductStockForm from './components/ProductStockForm.jsx';
import { CartContext } from './cart/CartContext.js';
import { CartProvider } from './cart/CartProvider.jsx';
import CartPage from './cart/CartPage.jsx';
import OrdersPage from './cart/OrdersPage.jsx';

import potatoImage from './assets/products/potato.jpg';
import honeyImage from './assets/products/honey.jpg';
import milkImage from './assets/products/milk.jpg';
import applesImage from './assets/products/apples.jpg';

const productImages = {
    'Картофель, 1 кг': potatoImage,
    'Мёд натуральный, 1 л': honeyImage,
    'Молоко фермерское, 1 л': milkImage,
    'Яблоки, 1 кг': applesImage,
};

function addProductImage(product) {
    return {
        ...product,
        image: productImages[product.name] || product.image || null,
    };
}

function Store() {
    const { count, items, add } = useContext(CartContext);
    const [currentUrl, setCurrentUrl] = useState(() => window.location.href);
    const { pathname, searchParams } = new URL(currentUrl);
    const isCart = /^\/cart\/?$/.test(pathname);
    const isOrders = /^\/orders\/?$/.test(pathname);
    const showCatalog = !isCart && !isOrders;
    const [authMessage, setAuthMessage] = useState('');

    const [user, setUser] = useState(() => {
        if (!localStorage.getItem('token')) return null;

        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    });

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        function onPopState() {
            setCurrentUrl(window.location.href);
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        function onExpired() {
            setUser(null);
            setAuthMessage('Сессия истекла. Войдите заново.');
        }

        window.addEventListener('auth:expired', onExpired);

        return () => {
            window.removeEventListener('auth:expired', onExpired);
        };
    }, []);

    useEffect(() => {
        if (!showCatalog || !localStorage.getItem('token')) return;

        let active = true;

        apiFetch('/auth/me')
            .then((currentUser) => {
                if (active) {
                    setUser(currentUser);
                    localStorage.setItem(
                        'user',
                        JSON.stringify(currentUser)
                    );
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [showCatalog]);

    function handleLogin(currentUser, token) {
        setAuthMessage('');

        localStorage.setItem('token', token);
        localStorage.setItem(
            'user',
            JSON.stringify(currentUser)
        );

        setUser(currentUser);
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
    }

    // Загрузка товаров с Express API
    useEffect(() => {
        if (isOrders) return;
        async function loadProducts() {
            try {
                const data = await apiFetch('/products');

                const productsWithImages =
                    data.map(addProductImage);

                setProducts(productsWithImages);
                setLoading(false);
            } catch (error) {
                setError('Не удалось загрузить товары');
                setLoading(false);

                console.error(error);
            }
        }

        loadProducts();
    }, [isOrders]);

    // Поиск товаров
    const filteredProducts = products.filter((product) =>
        product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    function openCreatedOrder(id) {
        window.history.pushState(null, '', `/orders?created=${encodeURIComponent(id)}`);
        setCurrentUrl(window.location.href);
    }

    if (!showCatalog) {
        const created = searchParams.get('created');
        return (
            <>
                <Header cartCount={count} />
                <main className="page account-page">
                    {isCart
                        ? <CartPage onCreated={openCreatedOrder} products={loading || error ? null : products} />
                        : <OrdersPage created={/^\d+$/.test(created || '') ? created : null} />}
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            {/* Шапка сайта */}
            <Header cartCount={count} />

            {/* Основное содержимое */}
            <main className="page">

                {/* Приветственный блок */}
                <section className="hero">
                    <h2>
                        Свежие фермерские продукты
                    </h2>

                    <p>
                        Натуральные продукты от местных
                        производителей.
                    </p>
                </section>

                {/* Каталог товаров */}
                <section
                    id="catalog"
                    className="catalog"
                >
                    {/* Панель поиска */}
                    <div className="catalog-toolbar">
                        <h2>Каталог</h2>

                        <input
                            type="search"
                            placeholder="Поиск товара..."
                            aria-label="Поиск товара"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />
                    </div>

                    {/* Состояние загрузки */}
                    {loading && <p>Загрузка...</p>}

                    {/* Сообщение об ошибке */}
                    {error && <p>{error}</p>}

                    {/* Сетка карточек */}
                    {!loading && !error && (
                        <div className="product-grid">
                            {filteredProducts.length === 0 && (
                                <p>Товаров нет</p>
                            )}

                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={add}
                                    quantity={items.find((item) => item.id === product.id)?.quantity}
                                    stockEditor={user?.role === 'admin' && (
                                        <ProductStockForm product={product} onSaved={(updated) =>
                                            setProducts((current) => current.map((item) =>
                                                item.id === updated.id ? addProductImage(updated) : item
                                            ))
                                        } />
                                    )}
                                    featured={
                                        String(product.id) === '1'
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Боковая панель доставки */}
                <aside
                    id="delivery"
                    className="sidebar"
                >
                    <h3>Доставка</h3>

                    <ul>
                        <li>
                            Астана — на следующий день
                        </li>

                        <li>
                            Акмолинская область — 2–3 дня
                        </li>

                        <li>
                            Бесплатно от 20 000 тг
                        </li>
                    </ul>
                </aside>

                {/* Форма оптовой заявки */}
                <ContactForm />

                {authMessage && (
                    <p role="alert">
                        {authMessage}
                    </p>
                )}

                {user ? (
                    <section
                        className="contact auth-bar"
                        aria-label="Аккаунт"
                    >
                        <p>
                            Вы вошли как {user.name} ({user.role})
                        </p>

                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Выйти
                        </button>
                    </section>
                ) : (
                    <LoginForm onLogin={handleLogin} />
                )}

                {user?.role === 'admin' && (
                    <AddProductForm
                        onAdded={(product) =>
                            setProducts((current) => [
                                ...current,
                                addProductImage(product),
                            ])
                        }
                    />
                )}

            </main>

            {/* Подвал сайта */}
            <Footer />
        </>
    );
}

export default function App() {
    return <CartProvider><Store /></CartProvider>;
}
