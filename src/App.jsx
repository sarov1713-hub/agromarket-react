import { useEffect, useState } from 'react';
import ProductCard from './components/ProductCard';

function App() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const filteredProducts = products.filter((product) =>
        product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    function handleAddToCart() {
        setCartCount(cartCount + 1);
    }

    return (
        <>
            <header className="header">
                <div className="container">
                    <h1>АгроМаркет</h1>

                    <nav>
                        <a href="#">Главная</a>
                        <a href="#catalog">Каталог</a>
                        <a href="#">Контакты</a>
                    </nav>

                    <div className="cart">
                        Корзина: {cartCount}
                    </div>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <h2>Свежие фермерские продукты</h2>

                    <p>
                        Натуральные продукты от местных производителей.
                    </p>
                </section>

                <section
                    className="catalog"
                    id="catalog"
                >
                    <h2>Каталог</h2>

                    <input
                        type="text"
                        placeholder="Поиск товара..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />

                    {loading && <p>Загрузка...</p>}

                    {error && <p>{error}</p>}

                    {!loading && !error && (
                        <div className="products">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={handleAddToCart}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <footer className="footer">
                <p>© 2026 АгроМаркет</p>
            </footer>
        </>
    );
}

export default App;