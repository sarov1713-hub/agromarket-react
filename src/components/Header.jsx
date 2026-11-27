
function Header({ cartCount = 0 }) {
    return (
        <header className="site-header">
            <a href="/" className="logo">
                🌾 АгроМаркет
            </a>

            <nav>
                <ul className="nav-links">
                    <li>
                        <a href="/#catalog">Каталог</a>
                    </li>
                    <li>
                        <a href="/#delivery">Доставка</a>
                    </li>
                    <li>
                        <a href="/#contact">Контакты</a>
                    </li>
                    <li>
                        <a href="/orders">Мои заказы</a>
                    </li>
                </ul>
            </nav>

            <a className="cart" href="/cart">Корзина ({cartCount})</a>
        </header>
    );
}

export default Header;
