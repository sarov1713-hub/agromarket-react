
function ProductCard({ product, onAdd, quantity = 0, featured = false, stockEditor }) {
    const unavailable = !Number.isInteger(product.stock) || product.stock <= 0;
    return (
        <article className={featured ? 'card card--featured' : 'card'}>
            {featured && (
                <span className="badge">
                    Товар недели
                </span>
            )}

            {product.image ? <img
                src={product.image}
                alt={product.name}
            /> : <div className="product-no-image">Фото пока нет</div>}

            <h3>{product.name}</h3>

            <p className="price">
                {product.price} тг
            </p>

            {quantity > 0 && <p>В корзине: {quantity}</p>}
            <button type="button" disabled={unavailable || quantity >= product.stock} onClick={() => onAdd(product)}>
                {unavailable ? 'Нет в наличии' : 'В корзину'}
            </button>
            {stockEditor}
        </article>
    );
}

export default ProductCard;
