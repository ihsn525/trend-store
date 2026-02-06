import React from 'react';

function ProductCard({ product, addToCart }) {
  return (
    <div className="product-card">
      <div className="image-container">
        <img src={product.image} alt={product.name} className="product-image" />
      </div>
      <div className="product-info">
        <span className="product-category">Essentials</span>
        <h3>{product.name}</h3>
        <span className="price-tag">${product.price.toFixed(2)}</span>
      </div>
      <button className="add-btn" onClick={() => addToCart(product)}>
        <span>+</span> Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;