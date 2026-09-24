
import { useEffect, useState } from 'react';

import ProductCard from './components/ProductCard';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactForm from './components/ContactForm';

function App() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Загрузка товаров с json-server
    useEffect(() => {
        async function loadProducts() {
            try {
                const response = await fetch(
                    'http://localhost:3001/products'
                );

                if (!response.ok) {
                    throw new Error('Ошибка загрузки товаров');
                }

                const data = await response.json();

                setProducts(data);
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
                    <h2>Свежие фермерские продукты</h2>

                    <p>
                        Натуральные продукты от местных производителей.
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
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={handleAddToCart}
                                    featured={product.id === '1'}
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

            </main>

            {/* Подвал сайта */}
            <Footer />
        </>
    );
}

export default App;