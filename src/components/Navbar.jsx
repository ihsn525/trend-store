import React from 'react';

function Navbar({ cartCount, onCartClick }) {
  return (
    <nav className="navbar">
      <div className="nav-content">
        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#2563eb', letterSpacing: '-1.5px' }}>
          TrendStore
        </h2>
        <button 
          onClick={onCartClick}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', background: '#0f172a', 
            color: 'white', padding: '14px 28px', borderRadius: '50px', border: 'none', 
            cursor: 'pointer', fontWeight: '800', fontSize: '1rem'
          }}>
          <span>🛒</span>
          <span>Cart ({cartCount})</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;