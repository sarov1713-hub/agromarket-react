import { useEffect, useState } from 'react';

import ProductCard from './components/ProductCard';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactForm from './components/ContactForm';

import { apiFetch } from './api.js';
import LoginForm from './components/LoginForm.jsx';
import AddProductForm from './components/AddProductForm.jsx';

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

function App() {
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
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        if (!localStorage.getItem('token')) return;

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
    }, []);

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
    }, []);

    // Поиск товаров
    const filteredProducts = products.filter((product) =>
        product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Добавление товара в корзину
    function handleAddToCart() {
        setCartCount((prevCount) => prevCount + 1);
    }

    return (
        <>
            {/* Шапка сайта */}
            <Header cartCount={cartCount} />

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
                                    onAdd={handleAddToCart}
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

export default App;