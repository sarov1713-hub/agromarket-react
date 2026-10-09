
function ProductCard({ product, onAdd, featured = false }) {
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

            <button onClick={() => onAdd(product)}>
                В корзину
            </button>
        </article>
    );
}

export default ProductCard;
